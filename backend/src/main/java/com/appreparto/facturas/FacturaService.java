package com.appreparto.facturas;

import com.appreparto.common.exception.ResourceNotFoundException;
import com.appreparto.pedidos.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final PedidoService pedidoService;
    private final S3Service s3Service;

    public List<Factura> listarTodas() {
        return facturaRepository.findAll();
    }

    public List<Factura> listarPorEstado(Factura.Estado estado) {
        return facturaRepository.findByEstado(estado);
    }

    public Factura buscarPorId(Long id) {
        return facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura", id));
    }

    @Transactional
    public Factura crear(Factura factura) {
        pedidoService.buscarPorId(factura.getPedido().getId());
        if (facturaRepository.existsByNumeroFactura(factura.getNumeroFactura())) {
            throw new IllegalArgumentException("Ya existe una factura con el número: " + factura.getNumeroFactura());
        }
        return facturaRepository.save(factura);
    }

    @Transactional
    public Factura subirPdf(Long id, MultipartFile pdf) {
        Factura factura = buscarPorId(id);
        String url = s3Service.subirArchivo(pdf, "facturas");
        factura.setUrlPdfS3(url);
        return facturaRepository.save(factura);
    }

    @Transactional
    public Factura cambiarEstado(Long id, Factura.Estado estado) {
        Factura factura = buscarPorId(id);
        factura.setEstado(estado);
        return facturaRepository.save(factura);
    }
}
