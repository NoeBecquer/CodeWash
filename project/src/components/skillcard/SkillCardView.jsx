import React from 'react';
import ChallengeRenderer from './ChallengeRenderer';
import AnswerInput from './AnswerInput';

const SkillCardView = React.memo(({
  challenge,
  userAnswer,
  onAnswerChange,
  onSubmit,
}) => {
  return (
    <section className="skill-card-view flex flex-col gap-4">
      
      {/* Challenge display */}
      <ChallengeRenderer challenge={challenge} />

      {/* Answer input */}
      <AnswerInput
        value={userAnswer}
        onChange={onAnswerChange}
      />

      {/* Submit button */}
      <button
        onClick={onSubmit}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
      >
        Submit
      </button>

    </section>
  );
});

export default SkillCardView;