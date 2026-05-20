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
    private String title; // Tên khoản chi (VD:Đồ ăn, thức uống,...)
    private double amount; // Số tiền
    private String category; // Danh mục (VD: ăn uống, di chuyển)
    private LocalDate date; // Ngày chi tiêu

    // === THÊM ĐOẠN NÀY ĐỂ LIÊN KẾT VỚI USER ===
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

}
