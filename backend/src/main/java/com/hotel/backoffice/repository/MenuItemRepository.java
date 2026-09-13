package com.hotel.backoffice.repository;

import com.hotel.backoffice.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {

    List<MenuItem> findAllByOrderByCategoriaAscNombreAsc();
    List<MenuItem> findByDisponibleTrueOrderByCategoriaAscNombreAsc();
}