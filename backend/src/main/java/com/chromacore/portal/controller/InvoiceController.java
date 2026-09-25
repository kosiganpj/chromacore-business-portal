package com.chromacore.portal.controller;

import com.chromacore.portal.model.*;
import com.chromacore.portal.repo.*;
import com.chromacore.portal.service.InvoicePdfService;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class InvoiceController {
    private final InvoiceRepository invoices;
    private final UserRepository users;
    private final InvoicePdfService pdf;

    public InvoiceController(InvoiceRepository invoices, UserRepository users, InvoicePdfService pdf) {
        this.invoices=invoices; this.users=users; this.pdf=pdf;
    }

    @GetMapping("/customer/invoices")
    public List<Invoice> myInvoices(Authentication auth) {
        AppUser u=users.findByEmailIgnoreCase(auth.getName()).orElseThrow();
        return invoices.findByCustomerIdOrderByIssuedAtDesc(u.getId());
    }

    @GetMapping("/admin/invoices")
    public List<Invoice> allInvoices() { return invoices.findAll(); }

    @GetMapping("/customer/invoices/{id}/pdf")
    public ResponseEntity<byte[]> customerPdf(@PathVariable Long id, Authentication auth) {
        Invoice i=invoices.findById(id).orElseThrow();
        if(!i.getCustomer().getEmail().equalsIgnoreCase(auth.getName()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return pdfResponse(i);
    }

    @GetMapping("/admin/invoices/{id}/pdf")
    public ResponseEntity<byte[]> adminPdf(@PathVariable Long id) {
        return pdfResponse(invoices.findById(id).orElseThrow());
    }

    private ResponseEntity<byte[]> pdfResponse(Invoice i) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename="+i.getInvoiceNumber()+".pdf")
                .body(pdf.create(i));
    }
}
