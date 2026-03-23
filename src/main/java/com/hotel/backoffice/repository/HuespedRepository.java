package com.hotel.backoffice.repository;

import com.hotel.backoffice.entity.Huesped;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface HuespedRepository extends JpaRepository<Huesped, UUID> {
    Optional<Huesped> findByNroDocumento(String nroDocumento);
}