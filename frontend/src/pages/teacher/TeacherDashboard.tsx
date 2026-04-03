import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUnits } from '@/hooks/useContent';
import { useLeaderboard } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import UnitModal from '@/components/modals/UnitModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import type { CourseUnitDto } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { units, loading: unitsLoading, error, addUnit, editUnit, removeUnit } = useUnits();
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseUnitDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseUnitDto | null>(null);

  const loading = unitsLoading || leaderboardLoading;

const handleCreate = async (data: Omit<CourseUnitDto, 'id'>) => {
  await addUnit({
    title: data.title,
    description: data.description ?? undefined,
    hskLevel: data.hskLevel ?? undefined,
    orderIndex: data.orderIndex,
  });
  setShowCreateModal(false);
};

const handleEdit = async (data: Omit<CourseUnitDto, 'id'>) => {
  if (!editTarget) return;
  await editUnit(editTarget.id, {
    title: data.title,
    description: data.description ?? undefined,
    hskLevel: data.hskLevel ?? undefined,
    orderIndex: data.orderIndex,
  });
  setEditTarget(null);
};

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await removeUnit(deleteTarget.id);
    setDeleteTarget(null);
  };

  const chartData = leaderboard.map((s) => ({
    name: `#${s.studentId}`,
    xp: s.xpTotal,
    level: s.level,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {showCreateModal && (
        <UnitModal initial={null} onClose={() => setShowCreateModal(false)} onSave={handleCreate} />
      )}
      {editTarget && (
        <UnitModal initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Unit"
          description={`Are you sure you want to delete "${deleteTarget.title}"? This will also delete all lessons, exercises and materials inside it.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="space-y-8">

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Teacher Dashboard
            </h1>
            <p className="text-gray-400 text-sm">Manage course content and monitor student progress</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90 flex-shrink-0"
            style={{ background: '#e85d04' }}
          >
            + New Unit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart leaderboard XP */}
          <div className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Student XP Leaderboard
              </h2>
              <span className="text-xs text-gray-400">Top 10</span>
            </div>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">No student activity yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: '12px' }}
                    formatter={(value: number | string | undefined) => [`${value ?? 0} XP`, 'Total XP']}
                  />
                  <Bar dataKey="xp" fill="#e85d04" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {chartData.length > 0 && (
              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
                {leaderboard.slice(0, 3).map((s, index) => (
                  <div key={s.studentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-5 text-center" style={{ color: index === 0 ? '#e85d04' : '#9ca3af' }}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">Student #{s.studentId}</span>
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#fff7f0', color: '#e85d04' }}>
                        Lv.{s.level}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#e85d04' }}>{s.xpTotal} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sumar unitati */}
          <div className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Course Overview
              </h2>
              <span className="text-xs text-gray-400">{units.length} units</span>
            </div>
            {units.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">No units created yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {units.slice(0, 6).map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => navigate(`/teacher/units/${unit.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#e85d04' }}>
                        {unit.orderIndex}
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate">{unit.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {unit.hskLevel && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: '#fff7f0', color: '#e85d04' }}>
                          HSK {unit.hskLevel}
                        </span>
                      )}
                      <span className="text-sm font-thin transition-transform group-hover:translate-x-0.5" style={{ color: '#e85d04' }}>→</span>
                    </div>
                  </button>
                ))}
                {units.length > 6 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{units.length - 6} more units</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lista completa unitati */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Course Units
          </h2>
          {units.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
              <p className="text-gray-400 text-sm">No course units yet. Create your first unit to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl p-6 flex items-center justify-between group transition-all hover:shadow-md cursor-pointer"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                  onClick={() => navigate(`/teacher/units/${unit.id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: '#e85d04' }}>
                      {unit.orderIndex}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {unit.title}
                        </p>
                        {unit.hskLevel && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: '#fff7f0', color: '#e85d04' }}>
                            HSK {unit.hskLevel}
                          </span>
                        )}
                      </div>
                      {unit.description && (
                        <p className="text-sm text-gray-400 truncate mt-0.5">{unit.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditTarget(unit)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                      style={{ color: '#6b7280' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(unit)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-red-50"
                      style={{ color: '#c1121f' }}
                    >
                      Delete
                    </button>
                    <span className="text-xl font-thin transition-transform group-hover:translate-x-1 ml-1" style={{ color: '#e85d04' }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default TeacherDashboard;