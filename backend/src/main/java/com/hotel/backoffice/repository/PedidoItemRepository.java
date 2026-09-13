package com.hotel.backoffice.repository;

import com.hotel.backoffice.entity.PedidoItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoItemRepository extends JpaRepository<PedidoItem, Long> {

    boolean existsByMenuItemId(Integer menuItemId);
}