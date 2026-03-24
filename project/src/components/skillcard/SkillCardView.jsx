const SkillCardView = ({
  challenge,
  userAnswer,
  onAnswerChange,
  onSubmit,
}) => {
  return (
    <div>
      <ChallengeRenderer challenge={challenge} />
      <AnswerInput value={userAnswer} onChange={onAnswerChange} />
      <button onClick={onSubmit}>Submit</button>
    </div>
  );
};