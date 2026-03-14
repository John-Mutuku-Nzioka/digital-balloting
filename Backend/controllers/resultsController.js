const db = require('../config/db');
const { decrypt } = require('../utils/encryption');

async function getResults(req, res) {
  const { election_id } = req.params;
  try {
    const [election] = await db.query(
      'SELECT * FROM elections WHERE election_id = ?', [election_id]
    );
    if (election.length === 0)
      return res.status(404).json({ message: 'Election not found.' });

    const [positions] = await db.query(
      'SELECT * FROM positions WHERE election_id = ?', [election_id]
    );

    const [allVotes] = await db.query(
      'SELECT * FROM votes WHERE election_id = ?', [election_id]
    );

    // Tally votes by decrypting each
    const tally = {}; // { candidate_id: count }
    for (const vote of allVotes) {
      const data = JSON.parse(decrypt(vote.encrypted_vote));
      tally[data.candidate_id] = (tally[data.candidate_id] || 0) + 1;
    }

    // Build results per position
    for (let pos of positions) {
      const [candidates] = await db.query(
        'SELECT candidate_id, name FROM candidates WHERE position_id = ?',
        [pos.position_id]
      );
      pos.candidates = candidates.map(c => ({
        ...c,
        votes: tally[c.candidate_id] || 0
      }));
    }

    const [totalVoters] = await db.query('SELECT COUNT(*) as total FROM voters');
    const [votedVoters] = await db.query(
      'SELECT COUNT(*) as voted FROM voters WHERE voted_flag = 1'
    );

    res.json({
      election: election[0],
      positions,
      total_voters: totalVoters[0].total,
      total_voted: votedVoters[0].voted,
      turnout_percentage: (
        (votedVoters[0].voted / totalVoters[0].total) * 100
      ).toFixed(1)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = { getResults };