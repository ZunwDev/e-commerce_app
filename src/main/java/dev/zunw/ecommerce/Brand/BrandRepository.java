package dev.zunw.ecommerce.Brand;

import io.micrometer.common.lang.NonNullApi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@NonNullApi
public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findByName(String name);

    @Query("SELECT b.id FROM Brand b WHERE LOWER(b.name) = LOWER(:name)")
    long findIdByLowerName(@Param("name") String name);
}