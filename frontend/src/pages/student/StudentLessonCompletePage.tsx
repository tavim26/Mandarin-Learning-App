import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Trophy, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationState {
  lessonTitle: string;
  unitId: number;
  xpAwarded: number | null;
}

const StudentLessonCompletePage = () => {
  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);

  
  const state = location.state as LocationState | null;

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!state) {
    navigate('/lessons', { replace: true });
    return null;
  }

  const { lessonTitle, unitId, xpAwarded } = state;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in relative">
      {/* Confetti overlay */}
      <Confetti
        width={width}
        height={height}
        recycle={showConfetti}
        numberOfPieces={400}
        gravity={0.15}
        className="absolute inset-0 z-50 pointer-events-none"
      />

      <div className="relative mb-8 animate-bounce-slow">
        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl" />
        <Trophy className="h-32 w-32 text-yellow-500 relative z-10 drop-shadow-xl" />
      </div>

      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
        Lesson Complete!
      </h1>
      
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        You successfully finished <span className="font-bold text-foreground">{lessonTitle}</span>. 
        Great job keeping up with your studies!
      </p>

      {/* Cardul cu recompense */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 mb-10 w-full max-w-xs shadow-sm transform transition-all hover:scale-105">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Rewards Earned
        </h3>
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-brand">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <div className="text-left">
            <div className="font-display text-3xl font-bold text-brand">
              {xpAwarded ? `+${xpAwarded}` : '+0'}
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              XP Points
            </div>
          </div>
        </div>
        {!xpAwarded && (
          <p className="text-xs text-muted-foreground mt-3 italic">
            XP is awarded only on the first completion.
          </p>
        )}
      </div>

      <Button 
        onClick={() => navigate(`/lessons/units/${unitId}`)} 
        className="btn-brand h-14 px-8 text-lg rounded-full w-full max-w-xs gap-2"
      >
        Continue
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default StudentLessonCompletePage;