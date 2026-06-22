#!/usr/bin/env bash
# =============================================================================
# setup-aws.sh — Crea la infraestructura AWS para APP Reparto
# Requisito: AWS CLI instalado y configurado (aws configure)
# Uso: bash scripts/setup-aws.sh
# =============================================================================
set -e

REGION="us-east-1"
S3_BUCKET="app-reparto-docs"
IAM_ROLE_NAME="AppRepartoEC2Role"
INSTANCE_PROFILE_NAME="AppRepartoEC2Profile"
SG_NAME="appreparto-sg"

echo "=== [1/5] Creando bucket S3: $S3_BUCKET ==="
if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  echo "    Bucket ya existe, omitiendo..."
else
  aws s3api create-bucket \
    --bucket "$S3_BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null \
    || aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION"

  # Bloquear acceso público (los documentos se acceden vía signed URLs)
  aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  echo "    Bucket creado y acceso público bloqueado."
fi

echo ""
echo "=== [2/5] Creando IAM Role para EC2 (S3 + SES + SNS) ==="
# Trust policy: permite que EC2 asuma el rol
cat > /tmp/trust-policy.json << 'TRUST'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
TRUST

if aws iam get-role --role-name "$IAM_ROLE_NAME" 2>/dev/null; then
  echo "    Rol ya existe, omitiendo creación..."
else
  aws iam create-role \
    --role-name "$IAM_ROLE_NAME" \
    --assume-role-policy-document file:///tmp/trust-policy.json \
    --description "Rol EC2 para APP Reparto — acceso a S3, SES y SNS"
fi

# Permisos mínimos: S3 (solo el bucket propio), SES, SNS
cat > /tmp/app-policy.json << POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::${S3_BUCKET}",
        "arn:aws:s3:::${S3_BUCKET}/*"
      ]
    },
    {
      "Sid": "SESAccess",
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    },
    {
      "Sid": "SNSAccess",
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "*"
    }
  ]
}
POLICY

aws iam put-role-policy \
  --role-name "$IAM_ROLE_NAME" \
  --policy-name "AppRepartoPolicy" \
  --policy-document file:///tmp/app-policy.json
echo "    Permisos S3/SES/SNS asignados al rol."

# Instance Profile
if aws iam get-instance-profile --instance-profile-name "$INSTANCE_PROFILE_NAME" 2>/dev/null; then
  echo "    Instance profile ya existe."
else
  aws iam create-instance-profile --instance-profile-name "$INSTANCE_PROFILE_NAME"
  aws iam add-role-to-instance-profile \
    --instance-profile-name "$INSTANCE_PROFILE_NAME" \
    --role-name "$IAM_ROLE_NAME"
  echo "    Instance profile creado."
fi

echo ""
echo "=== [3/5] Creando Security Group: $SG_NAME ==="
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" --output text --region "$REGION")

EXISTING_SG=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
  --query "SecurityGroups[0].GroupId" --output text --region "$REGION" 2>/dev/null || true)

if [ "$EXISTING_SG" != "None" ] && [ -n "$EXISTING_SG" ]; then
  SG_ID="$EXISTING_SG"
  echo "    Security group ya existe: $SG_ID"
else
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "APP Reparto — HTTP y SSH" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query "GroupId" --output text)
  echo "    Security group creado: $SG_ID"

  # SSH (22) y HTTP (80)
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" --region "$REGION" \
    --ip-permissions \
      "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=0.0.0.0/0,Description=SSH}]" \
      "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTP}]"
fi

echo ""
echo "=== [4/5] Lanzando instancia EC2 (t2.micro — Free Tier) ==="
# AMI Amazon Linux 2023 us-east-1
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
  --query "sort_by(Images,&CreationDate)[-1].ImageId" \
  --output text --region "$REGION")

echo "    AMI seleccionada: $AMI_ID"
echo "    IMPORTANTE: Asegúrate de tener un Key Pair creado en AWS."
echo "    Introduce el nombre de tu Key Pair (o presiona Enter para omitir SSH):"
read -r KEY_NAME

# User data: instala Docker y Docker Compose al iniciar
USER_DATA=$(cat << 'USERDATA'
#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Docker Compose v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
USERDATA
)

LAUNCH_ARGS=(
  --image-id "$AMI_ID"
  --instance-type t2.micro
  --iam-instance-profile Name="$INSTANCE_PROFILE_NAME"
  --security-group-ids "$SG_ID"
  --user-data "$USER_DATA"
  --region "$REGION"
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=appreparto-server}]"
  --query "Instances[0].InstanceId"
  --output text
)

if [ -n "$KEY_NAME" ]; then
  LAUNCH_ARGS+=(--key-name "$KEY_NAME")
fi

INSTANCE_ID=$(aws ec2 run-instances "${LAUNCH_ARGS[@]}")
echo "    Instancia lanzada: $INSTANCE_ID"

echo ""
echo "    Esperando que la instancia esté en running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" --region "$REGION" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo ""
echo "=== [5/5] Infraestructura lista ==="
echo ""
echo "  IP pública EC2 : $PUBLIC_IP"
echo "  Instance ID    : $INSTANCE_ID"
echo "  Security Group : $SG_ID"
echo "  IAM Role       : $IAM_ROLE_NAME"
echo "  S3 Bucket      : $S3_BUCKET"
echo ""
echo "  Próximo paso:"
echo "    bash scripts/deploy.sh $PUBLIC_IP"
echo ""
echo "  (Espera ~60s para que Docker se instale via user-data antes de hacer deploy)"
