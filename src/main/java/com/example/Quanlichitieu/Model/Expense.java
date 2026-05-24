package com.example.Quanlichitieu.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name="Expenses")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title; 
    private Double amount; // Đổi sang Double để tránh lỗi null primitive
    private String category; 
    private LocalDate date; // Đã chuẩn hóa kiểu LocalDate hỗ trợ Hibernate Mapping

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}