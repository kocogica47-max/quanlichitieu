package com.example.Quanlichitieu.Repository;

import com.example.Quanlichitieu.Model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    
    // Hàm tìm kiếm danh sách chi tiêu dựa theo ID của người dùng đăng nhập
    List<Expense> findByUserId(Long userId);
    
}