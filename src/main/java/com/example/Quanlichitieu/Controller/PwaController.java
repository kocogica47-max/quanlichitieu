package com.example.Quanlichitieu.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import java.io.IOException;

/**
 * Serves PWA assets with correct HTTP headers.
 * Service worker must be served from root scope ("/sw.js")
 * with proper content-type for browsers to register it.
 */
@Controller
public class PwaController {

    /**
     * Serve service worker from root scope.
     * Service-Worker-Allowed header allows SW to control all paths under "/".
     */
    @GetMapping(value = "/sw.js", produces = "application/javascript")
    @ResponseBody
    public ResponseEntity<byte[]> serviceWorker() throws IOException {
        ClassPathResource resource = new ClassPathResource("static/sw.js");
        byte[] content = StreamUtils.copyToByteArray(resource.getInputStream());
        return ResponseEntity.ok()
                .header("Service-Worker-Allowed", "/")
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .contentType(MediaType.parseMediaType("application/javascript"))
                .body(content);
    }

    /**
     * Offline fallback page when network unavailable.
     */
    @GetMapping("/offline")
    public String offlinePage() {
        return "offline";
    }
}
