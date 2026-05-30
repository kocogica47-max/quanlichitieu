package com.example.Quanlichitieu.Controller;

import com.example.Quanlichitieu.Model.Expense;
import com.example.Quanlichitieu.Model.User;
import com.example.Quanlichitieu.Repository.ExpenseRepository;
import com.example.Quanlichitieu.Repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class ControllerExpense { 

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    // --- CHỨC NĂNG ĐĂNG KÝ ---
    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam String username, @RequestParam String password) {
        if (userRepository.findByUsername(username) != null) {
            return "redirect:/register?error=true";
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        userRepository.save(user);
        return "redirect:/login";
    }

    // --- CHỨC NĂNG ĐĂNG NHẬP ---
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    @PostMapping("/login")
    public String loginUser(@RequestParam String username, @RequestParam String password, HttpSession session) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password)) {
            session.setAttribute("loggedInUser", user);
            return "redirect:/";
        }
        return "redirect:/login?error=true";
    }

    // --- CHỨC NĂNG ĐĂNG XUẤT ---
    @GetMapping("/logout")
    public String logoutUser(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    // --- TRANG CHỦ (DANH SÁCH CHI TIÊU) ---
    @GetMapping("/")
    public String showIndex(Model model, HttpSession session,
                           @RequestParam(required = false) String category,
                           @RequestParam(required = false) String timeFilter) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }

        List<Expense> listExpenses = expenseRepository.findByUser_Id(loggedInUser.getId());
        
        // Lọc theo danh mục
        if (category != null && !category.isEmpty() && !category.equals("all")) {
            listExpenses = listExpenses.stream()
                .filter(exp -> category.equals(exp.getCategory()))
                .toList();
        }
        
        // Lọc theo thời gian
        if (timeFilter != null && !timeFilter.isEmpty() && !timeFilter.equals("all")) {
            LocalDate today = LocalDate.now();
            listExpenses = listExpenses.stream()
                .filter(exp -> {
                    if (exp.getDate() == null) return false;
                    LocalDate expDate = exp.getDate();
                    
                    switch (timeFilter) {
                        case "today":
                            return expDate.equals(today);
                        case "yesterday":
                            LocalDate yesterday = today.minusDays(1);
                            return expDate.equals(yesterday);
                        case "week":
                            return expDate.isAfter(today.minusWeeks(1)) && !expDate.isAfter(today);
                        case "month":
                            return expDate.getMonthValue() == today.getMonthValue() 
                                && expDate.getYear() == today.getYear();
                        case "lastMonth":
                            LocalDate lastMonth = today.minusMonths(1);
                            return expDate.getMonthValue() == lastMonth.getMonthValue() 
                                && expDate.getYear() == lastMonth.getYear();
                        default:
                            return true;
                    }
                })
                .toList();
        }
        
        model.addAttribute("listExpenses", listExpenses);
        model.addAttribute("username", loggedInUser.getUsername());
        model.addAttribute("selectedCategory", category != null ? category : "all");
        model.addAttribute("selectedTimeFilter", timeFilter != null ? timeFilter : "all");

        double totalAmount = 0;
        if (listExpenses != null) {
            for (Expense exp : listExpenses) {
                totalAmount += exp.getAmount();
            }
        }
        model.addAttribute("totalAmount", totalAmount);

        return "index";
    }

    // --- CHỨC NĂNG THÊM KHOẢN CHI MỚI ---
    @GetMapping("/showNewExpenseForm")
    public String showNewExpenseForm(Model model, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        Expense expense = new Expense();
        model.addAttribute("expense", expense);
        return "new_expense";
    }

    @PostMapping("/saveExpense")
    public String saveExpense(@ModelAttribute("expense") Expense expense, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        
        // Gán trực tiếp thực thể User hiện tại vào thuộc tính đối tượng của Expense
        expense.setUser(loggedInUser);
        
        expenseRepository.save(expense);
        return "redirect:/";
    }

    // --- CHỨC NĂNG XÓA KHOẢN CHI ---
    @GetMapping("/deleteExpense/{id}")
    public String deleteExpense(@PathVariable(value = "id") long id, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        expenseRepository.deleteById(id);
        return "redirect:/";
    }

    // --- API ĐỒ THỊ XU HƯỚNG ---
    @GetMapping("/api/xu-huong-chi-tieu")
    @ResponseBody
    public Map<String, Object> getXuHuongChiTieu(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        User loggedInUser = (User) session.getAttribute("loggedInUser");

        if (loggedInUser == null) {
            response.put("tongThangNay", 0.0);
            response.put("tongThangTruoc", 0.0);
            return response;
        }

        double tongThangNay = 0;
        double tongThangTruoc = 0;
        LocalDate today = LocalDate.now();

        List<Expense> listExpenses = expenseRepository.findByUser_Id(loggedInUser.getId());
        if (listExpenses != null) {
            for (Expense exp : listExpenses) {
                if (exp.getDate() == null) continue;
                
                LocalDate expDate = exp.getDate();
                if (expDate.getMonthValue() == today.getMonthValue() && expDate.getYear() == today.getYear()) {
                    tongThangNay += exp.getAmount();
                } else if (expDate.getMonthValue() == today.minusMonths(1).getMonthValue() && expDate.getYear() == today.minusMonths(1).getYear()) {
                    tongThangTruoc += exp.getAmount();
                }
            }
        }

        response.put("labelThangNay", "Tháng " + today.getMonthValue());
        response.put("tongThangNay", tongThangNay);
        response.put("labelThangTruoc", "Tháng " + today.minusMonths(1).getMonthValue());
        response.put("tongThangTruoc", tongThangTruoc);

        return response;
    }

    // --- API ĐỒ THỊ TRÒN THEO DANH MỤC ---
    @GetMapping("/api/chi-tieu-theo-danh-muc")
    @ResponseBody
    public Map<String, Object> getChiTieuTheoDanhMuc(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        User loggedInUser = (User) session.getAttribute("loggedInUser");

        if (loggedInUser == null) {
            response.put("categories", new String[0]);
            response.put("amounts", new double[0]);
            return response;
        }

        List<Expense> listExpenses = expenseRepository.findByUser_Id(loggedInUser.getId());
        Map<String, Double> categoryMap = new HashMap<>();

        if (listExpenses != null) {
            for (Expense exp : listExpenses) {
                String category = exp.getCategory();
                if (category == null || category.isEmpty()) {
                    category = "Khác";
                }
                categoryMap.put(category, categoryMap.getOrDefault(category, 0.0) + exp.getAmount());
            }
        }

        response.put("categories", categoryMap.keySet().toArray(new String[0]));
        response.put("amounts", categoryMap.values().toArray(new Double[0]));

        return response;
    }
}
