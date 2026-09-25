package com.chromacore.portal.service;

import com.chromacore.portal.model.Invoice;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class InvoicePdfService {
    public byte[] create(Invoice invoice) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage();
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    var font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                    cs.beginText();
                    cs.setFont(font, 18);
                    cs.newLineAtOffset(50, 740);
                    cs.showText("CHROMACORE DYES & CHEMICALS");
                    cs.setFont(font, 12);
                    cs.newLineAtOffset(0, -35);
                    cs.showText("Invoice: " + invoice.getInvoiceNumber());
                    cs.newLineAtOffset(0, -20);
                    cs.showText("Customer: " + invoice.getCustomer().getCompanyName());
                    cs.newLineAtOffset(0, -20);
                    cs.showText("Order: " + invoice.getOrder().getOrderNumber());
                    cs.newLineAtOffset(0, -20);
                    cs.showText(String.format("Amount: %.2f", invoice.getAmount()));
                    cs.newLineAtOffset(0, -20);
                    cs.showText(String.format("Paid: %.2f", invoice.getPaidAmount()));
                    cs.newLineAtOffset(0, -20);
                    cs.showText(String.format("Outstanding: %.2f", invoice.getOutstanding()));
                    cs.newLineAtOffset(0, -35);
                    cs.showText("Thank you for your business.");
                    cs.endText();
                }
                doc.save(out);
            }
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Could not create invoice PDF", e);
        }
    }
}
