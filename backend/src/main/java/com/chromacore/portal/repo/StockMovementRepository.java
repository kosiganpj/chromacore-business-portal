package com.chromacore.portal.repo;
import com.chromacore.portal.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface StockMovementRepository extends JpaRepository<StockMovement,Long> {
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);
}
