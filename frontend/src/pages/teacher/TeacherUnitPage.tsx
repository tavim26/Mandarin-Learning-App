import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getUnitFull,
  getLessonsByUnit,
  createLesson,
  updateLesson,
  deleteLesson,
  type CourseUnitDto,
  type LessonDto,
} from '@/api/contentApi';
import { Button } from '@/components/ui/button';
import LessonModal from '@/components/modals/LessonModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';

const TeacherUnitPage = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const parsedUnitId = parseInt(unitId ?? '0');

  const [unit, setUnit] = useState<CourseUnitDto | null>(null);
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<LessonDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LessonDto | null>(null);

  useEffect(() => {
    fetchData();
  }, [parsedUnitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unitData, lessonsData] = await Promise.all([
        getUnitFull(parsedUnitId),
        getLessonsByUnit(parsedUnitId),
      ]);
      setUnit(unitData);
      setLessons(lessonsData);
    } catch {
      setError('Failed to load unit data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Omit<LessonDto, 'id' | 'exercises'>) => {
    await createLesson(data);
    await fetchData();
  };

  const handleEdit = async (data: Omit<LessonDto, 'id' | 'exercises'>) => {
    if (!editTarget) return;
    await updateLesson(editTarget.id, data);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteLesson(deleteTarget.id);
    setDeleteTarget(null);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error ?? 'Unit not found.'}</p>
      </div>
    );
  }

  return (
    <>
      {showCreateModal && (
        <LessonModal
          unitId={parsedUnitId}
          initial={null}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}
      {editTarget && (
        <LessonModal
          unitId={parsedUnitId}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Lesson"
          description={`Are you sure you want to delete "${deleteTarget.title}"? This will also delete all exercises and materials inside it.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/teacher/dashboard"
            className="font-medium transition-colors hover:opacity-70"
            style={{ color: '#e85d04' }}
          >
            Course Units
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500 truncate">{unit.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {unit.title}
              </h1>
              {unit.hskLevel && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-md"
                  style={{ background: '#fff7f0', color: '#e85d04' }}
                >
                  HSK {unit.hskLevel}
                </span>
              )}
            </div>
            {unit.description && (
              <p className="text-gray-400 text-sm">{unit.description}</p>
            )}
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90 flex-shrink-0"
            style={{ background: '#e85d04' }}
          >
            + New Lesson
          </Button>
        </div>

        {/* Lista lectii */}
        {lessons.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-12 text-center"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <p className="text-gray-400 text-sm">
              No lessons yet. Add the first lesson to this unit.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl p-6 flex items-center justify-between group transition-all hover:shadow-md cursor-pointer"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                onClick={() => navigate(`/teacher/lessons/${lesson.id}`)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: '#0369a1' }}
                  >
                    {lesson.orderIndex}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-base font-bold text-gray-900"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {lesson.title}
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: '#f0fdf4', color: '#15803d' }}
                      >
                        {lesson.xpReward} XP
                      </span>
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-gray-400 truncate mt-0.5">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 flex-shrink-0 ml-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditTarget(lesson)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                    style={{ color: '#6b7280' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-red-50"
                    style={{ color: '#c1121f' }}
                  >
                    Delete
                  </button>
                  <span
                    className="text-xl font-thin transition-transform group-hover:translate-x-1 ml-1"
                    style={{ color: '#0369a1' }}
                  >
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TeacherUnitPage;