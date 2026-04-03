import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLesson, useExercises, useMaterials } from '@/hooks/useContent';
import { useLessonLeaderboard } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import ExerciseModal from '@/components/modals/ExerciseModal';
import MaterialModal from '@/components/modals/MaterialModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import type { ExerciseDto, LessonMaterialDto } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const TeacherLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const parsedLessonId = parseInt(lessonId ?? '0');

  const { lesson, loading: lessonLoading, error: lessonError } = useLesson(parsedLessonId);
  const { exercises, loading: exLoading, addExercise, editExercise: editEx, removeExercise } = useExercises(parsedLessonId);
  const { materials, loading: matLoading, addMaterial, removeMaterial } = useMaterials(parsedLessonId);
  const { leaderboard: lessonLeaderboard } = useLessonLeaderboard(parsedLessonId);

  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [editExerciseTarget, setEditExerciseTarget] = useState<ExerciseDto | null>(null);
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<ExerciseDto | null>(null);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [deleteMaterialTarget, setDeleteMaterialTarget] = useState<LessonMaterialDto | null>(null);

  const loading = lessonLoading || exLoading || matLoading;

  const handleCreateExercise = async (data: Omit<ExerciseDto, 'id'>) => {
  await addExercise({
    lessonId: data.lessonId,
    type: data.type,
    prompt: data.prompt,
    difficulty: data.difficulty ?? undefined,
    contentData: data.contentData ?? undefined,
  });
  setShowCreateExercise(false);
};

const handleEditExercise = async (data: Omit<ExerciseDto, 'id' | 'lessonId'>) => {
  if (!editExerciseTarget) return;
  await editEx(editExerciseTarget.id, {
    type: data.type,
    prompt: data.prompt,
    difficulty: data.difficulty ?? undefined,
    contentData: data.contentData ?? undefined,
  });
  setEditExerciseTarget(null);
};

  const handleDeleteExercise = async () => {
    if (!deleteExerciseTarget) return;
    await removeExercise(deleteExerciseTarget.id);
    setDeleteExerciseTarget(null);
  };

  const handleCreateMaterial = async (data: Omit<LessonMaterialDto, 'id'>) => {
    await addMaterial(data);
    setShowCreateMaterial(false);
  };

  const handleDeleteMaterial = async () => {
    if (!deleteMaterialTarget) return;
    await removeMaterial(deleteMaterialTarget.id);
    setDeleteMaterialTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{lessonError ?? 'Lesson not found.'}</p>
      </div>
    );
  }

  return (
    <>
      {showCreateExercise && (
        <ExerciseModal lessonId={parsedLessonId} initial={null} onClose={() => setShowCreateExercise(false)} onSave={handleCreateExercise as never} />
      )}
      {editExerciseTarget && (
        <ExerciseModal lessonId={parsedLessonId} initial={editExerciseTarget} onClose={() => setEditExerciseTarget(null)} onSave={handleEditExercise as never} />
      )}
      {deleteExerciseTarget && (
        <DeleteConfirmModal
          title="Delete Exercise"
          description={`Are you sure you want to delete the exercise "${deleteExerciseTarget.prompt.slice(0, 50)}..."?`}
          onConfirm={handleDeleteExercise}
          onClose={() => setDeleteExerciseTarget(null)}
        />
      )}
      {showCreateMaterial && (
        <MaterialModal lessonId={parsedLessonId} onClose={() => setShowCreateMaterial(false)} onSave={handleCreateMaterial} />
      )}
      {deleteMaterialTarget && (
        <DeleteConfirmModal
          title="Delete Material"
          description={`Are you sure you want to delete "${deleteMaterialTarget.title}"?`}
          onConfirm={handleDeleteMaterial}
          onClose={() => setDeleteMaterialTarget(null)}
        />
      )}

      <div className="space-y-8">

        <div className="flex items-center gap-2 text-sm">
          <Link to="/teacher/dashboard" className="font-medium transition-colors hover:opacity-70" style={{ color: '#e85d04' }}>
            Course Units
          </Link>
          <span className="text-gray-400">/</span>
          <Link to={`/teacher/units/${lesson.unitId}`} className="font-medium transition-colors hover:opacity-70" style={{ color: '#e85d04' }}>
            Unit #{lesson.unitId}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500 truncate">{lesson.title}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {lesson.title}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: '#f0fdf4', color: '#15803d' }}>
              {lesson.xpReward} XP
            </span>
          </div>
          {lesson.description && <p className="text-gray-400 text-sm">{lesson.description}</p>}
        </div>

        {/* Student progress chart */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Student Progress
            <span className="ml-2 text-sm font-normal text-gray-400">({lessonLeaderboard.length} students)</span>
          </h2>
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
            {lessonLeaderboard.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-gray-400">No students have started this lesson yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={lessonLeaderboard.map((s) => ({
                    name: `#${s.studentId}`,
                    completion: Math.round(s.completionPct),
                    status: s.status,
                  }))}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: '12px' }}
                    formatter={(value: number | string | undefined, _name, props) => [
                      `${value ?? 0}% — ${(props as { payload?: { status?: string } })?.payload?.status ?? ''}`,
                      'Completion',
                    ]}
                    cursor={{ fill: '#f0f9ff' }}
                  />
                  <Bar dataKey="completion" fill="#0369a1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Exercitii */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Exercises
              <span className="ml-2 text-sm font-normal text-gray-400">({exercises.length})</span>
            </h2>
            <Button onClick={() => setShowCreateExercise(true)} className="h-10 px-5 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: '#e85d04' }}>
              + Add Exercise
            </Button>
          </div>
          {exercises.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
              <p className="text-gray-400 text-sm">No exercises yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div key={ex.id} className="bg-white rounded-2xl p-5 flex items-start justify-between" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0 mt-0.5" style={{ background: '#fff7f0', color: '#e85d04' }}>
                      {ex.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug">{ex.prompt}</p>
                      {ex.difficulty && <p className="text-xs text-gray-400 mt-0.5">Difficulty: {ex.difficulty}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button onClick={() => setEditExerciseTarget(ex)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100" style={{ color: '#6b7280' }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteExerciseTarget(ex)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-red-50" style={{ color: '#c1121f' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Materiale */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Materials
              <span className="ml-2 text-sm font-normal text-gray-400">({materials.length})</span>
            </h2>
            <Button onClick={() => setShowCreateMaterial(true)} className="h-10 px-5 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: '#0369a1' }}>
              + Add Material
            </Button>
          </div>
          {materials.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
              <p className="text-gray-400 text-sm">No materials yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((mat) => (
                <div key={mat.id} className="bg-white rounded-2xl p-5 flex items-center justify-between" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                      {mat.type || 'LINK'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{mat.title}</p>
                      <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs truncate hover:underline" style={{ color: '#0369a1' }}>
                        {mat.url}
                      </a>
                    </div>
                  </div>
                  <button onClick={() => setDeleteMaterialTarget(mat)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-red-50 flex-shrink-0 ml-4" style={{ color: '#c1121f' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default TeacherLessonPage;