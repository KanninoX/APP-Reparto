package com.appreparto.tracking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrackingRepository extends JpaRepository<TrackingGps, Long> {
    List<TrackingGps> findByVehiculoIdOrderByTimestampDesc(Long vehiculoId);
}
