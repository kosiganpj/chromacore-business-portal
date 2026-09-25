package com.chromacore.portal.repo;
import com.chromacore.portal.model.ShadeCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ShadeCardRepository extends JpaRepository<ShadeCard,Long> {
    List<ShadeCard> findByActiveTrueOrderByShadeNameAsc();
}
