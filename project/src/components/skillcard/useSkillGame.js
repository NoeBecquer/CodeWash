export const useSkillGame = ({ type, difficulty }) => {
  const [challenge, setChallenge] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');

  const loadChallenge = useCallback(async () => {
    const newChallenge = await generateChallenge(type, difficulty);
    setChallenge(newChallenge);
  }, [type, difficulty]);

  const validateAnswer = useCallback(() => {
    if (!challenge) return false;
    return normalizeText(userAnswer) === normalizeText(challenge.answer);
  }, [userAnswer, challenge]);

  return {
    challenge,
    userAnswer,
    setUserAnswer,
    loadChallenge,
    validateAnswer,
  };
};