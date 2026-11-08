package com.app.backend.service;

import com.app.backend.config.StorageProperties;
import com.app.backend.exception.InvalidFileException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileStorageServiceTest {

    @TempDir
    Path tempDirectory;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(new StorageProperties(tempDirectory.toString(), "/uploads"));
        fileStorageService.init();
    }

    @Test
    void storesImageWithGeneratedNameAndPublicUrl() {
        MockMultipartFile image = new MockMultipartFile(
                "file",
                "sample.JPG",
                "image/jpeg",
                "fake-image-content".getBytes()
        );

        FileStorageService.StoredFile storedFile = fileStorageService.store(image);

        assertTrue(Files.exists(storedFile.path()));
        assertTrue(storedFile.filename().endsWith(".jpg"));
        assertEquals("/uploads/" + storedFile.filename(), storedFile.url());
        assertEquals("image/jpeg", storedFile.contentType());
        assertEquals(image.getSize(), storedFile.size());
    }

    @Test
    void rejectsNonImageContent() {
        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "not an image".getBytes()
        );

        assertThrows(InvalidFileException.class, () -> fileStorageService.store(textFile));
    }

    @Test
    void rejectsUnsupportedImageExtension() {
        MockMultipartFile image = new MockMultipartFile(
                "file",
                "sample.gif",
                "image/jpeg",
                "fake-image-content".getBytes()
        );

        assertThrows(InvalidFileException.class, () -> fileStorageService.store(image));
    }

    @Test
    void deletesStoredImage() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "file",
                "sample.png",
                "image/png",
                "fake-image-content".getBytes()
        );

        FileStorageService.StoredFile storedFile = fileStorageService.store(image);
        fileStorageService.delete(storedFile.filename());

        assertTrue(Files.notExists(storedFile.path()));
    }

    @Test
    void resolvesPublicUrlBackToStoredPath() {
        MockMultipartFile image = new MockMultipartFile(
                "file",
                "sample.webp",
                "image/webp",
                "fake-image-content".getBytes()
        );

        FileStorageService.StoredFile storedFile = fileStorageService.store(image);

        assertEquals(storedFile.path(), fileStorageService.resolvePath(storedFile.url()));
    }
}
