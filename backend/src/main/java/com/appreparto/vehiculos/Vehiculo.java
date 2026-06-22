package com.appreparto.vehiculos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehiculos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, unique = true, length = 10)
    private String patente;

    @Column(name = "capacidad_kg")
    private Double capacidadKg;

    @Column(length = 50)
    private String tipo;

    @Builder.Default
    private boolean activo = true;
}
