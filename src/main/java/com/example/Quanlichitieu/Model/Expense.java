package com.example.Quanlichitieu.Model;

// BẮT BUỘC: Sử dụng thư viện jakarta cho Spring Boot 3
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity // <-- ĐÃ THÊM: Bắt buộc phải có để báo cho Spring biết đây là Model dữ liệu
@Table(name = "expenses") // (Tùy chọn) Tên bảng dưới database
public class Expense {

    @Id // <-- Bắt buộc phải có để đánh dấu khóa chính
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private Double amount;
    private String category;
    private LocalDate date;
    private Long userId;

    // --- CONSTRUCTOR ---
    public Expense() {
    }

    // --- GETTER VÀ SETTER (Đảm bảo đầy đủ để các file khác gọi không bị lỗi) ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}