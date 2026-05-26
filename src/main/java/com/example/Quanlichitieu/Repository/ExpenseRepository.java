package com.example.Quanlichitieu.Repository;

import com.example.Quanlichitieu.Model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    // Tìm kiếm danh sách chi tiêu dựa theo ID của User trong mối quan hệ đối tượng
    List<Expense> findByUser_Id(Long userId);
}