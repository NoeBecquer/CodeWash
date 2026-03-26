const ChallengeRenderer = ({ challenge }) => {
  if (!challenge) return null;

  switch (challenge.type) {
    case 'math':
      return <div>{challenge.question}</div>;

    case 'writing':
      return (
        <>
          <img src={challenge.images?.[0]} />
          <p>{challenge.displayName}</p>
        </>
      );

    case 'patterns':
      return <div>Simon Says</div>;

    default:
      return null;
  }
};