package com.chromacore.portal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class NotificationService {

    private final JavaMailSender mailSender;
    private final RestClient restClient = RestClient.create();

    @Value("${app.mail.from:no-reply@chromacore.local}")
    String mailFrom;

    @Value("${spring.mail.host:}")
    String mailHost;

    @Value("${app.whatsapp.token:}")
    String waToken;

    @Value("${app.whatsapp.phone-number-id:}")
    String waPhoneId;

    @Value("${app.whatsapp.graph-version:v23.0}")
    String waVersion;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends email in the background.
     *
     * The order API does NOT wait for Gmail SMTP.
     */
    @Async
    public void email(
            String to,
            String subject,
            String body
    ) {

        if (to == null || to.isBlank()) {
            System.out.println(
                    "[EMAIL SKIPPED] Recipient is empty | "
                            + subject
            );
            return;
        }

        if (mailHost == null || mailHost.isBlank()) {
            System.out.println(
                    "[EMAIL SKIPPED] SMTP host is not configured | "
                            + to
                            + " | "
                            + subject
            );
            return;
        }

        try {

            SimpleMailMessage message =
                    new SimpleMailMessage();

            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            System.out.println(
                    "[EMAIL SENT] "
                            + to
                            + " | "
                            + subject
            );

        } catch (Exception e) {

            System.err.println(
                    "[EMAIL FAILED] "
                            + to
                            + " | "
                            + subject
            );

            System.err.println(
                    "Reason: "
                            + e.getMessage()
            );
        }
    }

    /**
     * Sends WhatsApp message.
     */
    @Async
    public void whatsapp(
            String phone,
            String message
    ) {

        if (phone == null || phone.isBlank()) {
            System.out.println(
                    "[WHATSAPP SKIPPED] Phone is empty"
            );
            return;
        }

        if (waToken == null ||
                waToken.isBlank() ||
                waPhoneId == null ||
                waPhoneId.isBlank()) {

            System.out.println(
                    "[WHATSAPP SKIPPED] WhatsApp is not configured | "
                            + phone
            );
            return;
        }

        try {

            String url =
                    "https://graph.facebook.com/"
                            + waVersion
                            + "/"
                            + waPhoneId
                            + "/messages";

            restClient
                    .post()
                    .uri(url)
                    .header(
                            "Authorization",
                            "Bearer " + waToken
                    )
                    .body(
                            Map.of(
                                    "messaging_product",
                                    "whatsapp",

                                    "to",
                                    phone.replaceAll(
                                            "[^0-9]",
                                            ""
                                    ),

                                    "type",
                                    "text",

                                    "text",
                                    Map.of(
                                            "body",
                                            message
                                    )
                            )
                    )
                    .retrieve()
                    .toBodilessEntity();

            System.out.println(
                    "[WHATSAPP SENT] "
                            + phone
            );

        } catch (Exception e) {

            System.err.println(
                    "[WHATSAPP FAILED] "
                            + phone
            );

            System.err.println(
                    "Reason: "
                            + e.getMessage()
            );
        }
    }
}