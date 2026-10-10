from app.services.level_service import compute_level, next_level_info

T = [(1, 100), (2, 250), (3, 500)]


def test_compute_level_boundaries():
    assert compute_level(0, T) == 0
    assert compute_level(99, T) == 0
    assert compute_level(100, T) == 1
    assert compute_level(499, T) == 2
    assert compute_level(10_000, T) == 3


def test_next_level_info():
    assert next_level_info(120, T) == {"level": 1, "next_level": 2, "next_level_threshold": 250, "points_to_next": 130}
    assert next_level_info(900, T)["next_level"] is None
