package dev.zunw.ecommerce.Product;

import io.micrometer.common.lang.NonNullApi;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@NonNullApi
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findById(UUID id);

    List<Product> findByCategoryProductCategoryId(Pageable pageable, Long id);
    List<Product> findByBrandBrandId(Pageable pageable, Long id);
}
