package com.chineselearning.contentservice.repository;

import com.chineselearning.contentservice.domain.CourseUnit;
import com.chineselearning.contentservice.domain.dao.ICourseUnitDao;

import com.chineselearning.contentservice.repository.entities.CourseUnitEntity;
import com.chineselearning.contentservice.repository.jpa.CourseUnitJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class CourseUnitDao implements ICourseUnitDao
{

    private final CourseUnitJpaRepository jpaRepository;

    public CourseUnitDao(CourseUnitJpaRepository jpaRepository)
    {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<CourseUnit> findAllByOrderByOrderIndexAsc()
    {
        return jpaRepository.findAllByOrderByOrderIndexAsc().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CourseUnit> findById(Long id)
    {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public CourseUnit save(CourseUnit unit)
    {
        CourseUnitEntity saved = jpaRepository.save(toEntity(unit));
        return toDomain(saved);
    }

    @Override
    public void deleteById(Long id)
    {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id)
    {
        return jpaRepository.existsById(id);
    }

    @Override
    public List<CourseUnit> findByHskLevel(Integer hskLevel) {
        return jpaRepository.findByHskLevelOrderByOrderIndexAsc(hskLevel).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }




    private CourseUnit toDomain(CourseUnitEntity entity) {
        CourseUnit unit = new CourseUnit();
        unit.setId(entity.getId());
        unit.setTitle(entity.getTitle());
        unit.setDescription(entity.getDescription());
        unit.setHskLevel(entity.getHskLevel());
        unit.setOrderIndex(entity.getOrderIndex());
        return unit;
    }

    private CourseUnitEntity toEntity(CourseUnit unit) {
        CourseUnitEntity entity = new CourseUnitEntity();
        entity.setId(unit.getId());
        entity.setTitle(unit.getTitle());
        entity.setDescription(unit.getDescription());
        entity.setHskLevel(unit.getHskLevel());
        entity.setOrderIndex(unit.getOrderIndex());
        return entity;
    }
}