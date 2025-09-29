package com.sliit.library.controller;

import com.sliit.library.dto.BookCopyDto.*;
import com.sliit.library.model.BookStatus;
import com.sliit.library.service.BookCopyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/book-copies")
public class BookCopyController {

	private final BookCopyService service;

	public BookCopyController(BookCopyService service) {
		this.service = service;
	}

	@PostMapping
	public ResponseEntity<BookCopyResponse> create(@RequestBody BookCopyCreateRequest request) {
		return ResponseEntity.ok(service.create(request));
	}

    @GetMapping("/{id}")
    public ResponseEntity<BookCopyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }	@GetMapping
	public ResponseEntity<List<BookCopyResponse>> getAll(@RequestParam(defaultValue = "0") int page,
														@RequestParam(defaultValue = "10") int pageSize) {
		return ResponseEntity.ok(service.get(page, pageSize));
	}

	@PatchMapping("/{id}")
	public ResponseEntity<BookCopyResponse> update(@PathVariable Long id, @RequestBody BookCopyUpdateRequest request) {
		return ResponseEntity.ok(service.update(id, request));
	}

	@GetMapping("/available")
	public ResponseEntity<List<BookCopyResponse>> getAvailableCopies() {
		return ResponseEntity.ok(service.getAvailableCopies());
	}

	@GetMapping("/barcode/{barcode}")
	public ResponseEntity<BookCopyResponse> getByBarcode(@PathVariable String barcode) {
		return ResponseEntity.ok(service.getByBarcode(barcode));
	}

	@GetMapping("/search")
	public ResponseEntity<List<BookCopyResponse>> searchByBarcode(
			@RequestParam String barcode,
			@RequestParam(required = false) String status) {
		BookStatus bookStatus = null;
		if (status != null) {
			try {
				bookStatus = BookStatus.valueOf(status.toUpperCase());
			} catch (IllegalArgumentException e) {
				// Invalid status, ignore it
			}
		}
		return ResponseEntity.ok(service.searchByBarcode(barcode, bookStatus));
	}

	@GetMapping("/search-available")
	public ResponseEntity<List<BookCopyResponse>> searchAvailable(
			@RequestParam(required = false) String query,
			@RequestParam(defaultValue = "3") int size) {
		return ResponseEntity.ok(service.searchAvailable(query, size));
	}

	@GetMapping("/by-book/{bookId}")
	public ResponseEntity<List<BookCopyResponse>> getByBookId(@PathVariable Long bookId) {
		return ResponseEntity.ok(service.getByBookId(bookId));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}
}

