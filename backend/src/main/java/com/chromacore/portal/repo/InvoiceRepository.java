package com.chromacore.portal.repo;

import com.chromacore.portal.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByCustomerIdOrderByIssuedAtDesc(Long customerId);

    Optional<Invoice> findByOrderId(Long orderId);
}