package com.chromacore.portal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class NotificationService {
    private final JavaMailSender mailSender;
    private final RestClient restClient = RestClient.create();

    @Value("${app.mail.from:no-reply@chromacore.local}") String mailFrom;
    @Value("${spring.mail.host:}") String mailHost;
    @Value("${app.whatsapp.token:}") String waToken;
    @Value("${app.whatsapp.phone-number-id:}") String waPhoneId;
    @Value("${app.whatsapp.graph-version:v23.0}") String waVersion;

    public NotificationService(JavaMailSender mailSender) { this.mailSender = mailSender; }

    public void email(String to, String subject, String body) {
        if (to == null || to.isBlank() || mailHost == null || mailHost.isBlank()) {
            System.out.println("[EMAIL SKIPPED] " + to + " | " + subject);
            return;
        }
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(mailFrom); m.setTo(to); m.setSubject(subject); m.setText(body);
            mailSender.send(m);
        } catch (Exception e) {
            System.err.println("Email failed: " + e.getMessage());
        }
    }

    public void whatsapp(String phone, String message) {
        if (phone == null || phone.isBlank() || waToken.isBlank() || waPhoneId.isBlank()) {
            System.out.println("[WHATSAPP SKIPPED] " + phone + " | " + message);
            return;
        }
        try {
            String url = "https://graph.facebook.com/" + waVersion + "/" + waPhoneId + "/messages";
            restClient.post().uri(url)
                .header("Authorization", "Bearer " + waToken)
                .body(Map.of(
                    "messaging_product", "whatsapp",
                    "to", phone.replaceAll("[^0-9]", ""),
                    "type", "text",
                    "text", Map.of("body", message)
                ))
                .retrieve().toBodilessEntity();
        } catch (Exception e) {
            System.err.println("WhatsApp failed: " + e.getMessage());
        }
    }
}
