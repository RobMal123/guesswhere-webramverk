-- Users table (No changes)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(200) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) UNIQUE,
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255) UNIQUE,
    reset_token_expires TIMESTAMP WITH TIME ZONE
);

-- Categories table to normalize categories instead of using a string
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Before the locations table creation, add:
CREATE TYPE difficultylevel AS ENUM ('easy', 'medium', 'hard');

-- Locations table with additional metadata
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude FLOAT NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    name VARCHAR(100),
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    difficulty_level difficultylevel NOT NULL DEFAULT 'medium',
    country VARCHAR(100),
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pending locations table for user submissions
CREATE TABLE pending_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude FLOAT NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- Added VARCHAR(20)
    country VARCHAR(100),
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Index for pending locations
CREATE INDEX idx_pending_locations_user ON pending_locations(user_id);
CREATE INDEX idx_pending_locations_status ON pending_locations(status);

-- Game sessions table to track individual game attempts
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Scores table with game_session_id column
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    game_session_id INTEGER REFERENCES game_sessions(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    guess_latitude FLOAT NOT NULL CHECK (guess_latitude BETWEEN -90 AND 90),
    guess_longitude FLOAT NOT NULL CHECK (guess_longitude BETWEEN -180 AND 180),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leaderboard table
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0,
    average_score FLOAT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create new category_leaderboard table
CREATE TABLE category_leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, score)
);

-- Create indexes for better performance
CREATE INDEX idx_category_leaderboard_category ON category_leaderboard(category_id);
CREATE INDEX idx_category_leaderboard_score ON category_leaderboard(score DESC);
CREATE INDEX idx_category_leaderboard_user ON category_leaderboard(user_id);

-- Create a function to update category leaderboard
CREATE OR REPLACE FUNCTION update_category_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the score into category_leaderboard if it's in the top 10 for that category
    INSERT INTO category_leaderboard (user_id, category_id, score)
    SELECT 
        NEW.user_id,
        l.category_id,
        NEW.score
    FROM locations l
    WHERE l.id = NEW.location_id
    AND (
        SELECT COUNT(*)
        FROM category_leaderboard cl
        WHERE cl.category_id = l.category_id
        AND cl.score >= NEW.score
    ) < 10
    ON CONFLICT (user_id, category_id, score) DO NOTHING;

    -- Remove scores that are no longer in the top 10
    DELETE FROM category_leaderboard cl
    WHERE cl.category_id IN (
        SELECT category_id
        FROM locations
        WHERE id = NEW.location_id
    )
    AND cl.score < (
        SELECT MIN(score)
        FROM (
            SELECT score
            FROM category_leaderboard
            WHERE category_id = cl.category_id
            ORDER BY score DESC
            LIMIT 10
        ) top_10
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update category leaderboard when a new score is added
CREATE TRIGGER update_category_leaderboard_trigger
    AFTER INSERT ON scores
    FOR EACH ROW
    EXECUTE FUNCTION update_category_leaderboard();

-- Friends system for social interaction
CREATE TABLE friends (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id)
);

-- Achievements table: Defines achievement types
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    country VARCHAR(100),
    points_required INTEGER NOT NULL CHECK (points_required BETWEEN 0 AND 5000)
);

-- User Achievements table: Tracks which achievements a user has earned
CREATE TABLE user_achievements (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- Indexes for performance optimization
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_location_id ON scores(location_id);
CREATE INDEX idx_scores_game_session_id ON scores(game_session_id);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX idx_achievements_category ON achievements(category_id);
CREATE INDEX idx_achievements_country ON achievements(country);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Make sure this function is defined before any triggers that use it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'leaderboard' THEN
        NEW.last_updated = CURRENT_TIMESTAMP;
    ELSE
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Populate initial achievements
INSERT INTO achievements (name, description, points_required) VALUES
-- Bronze Tier
('Novice Explorer', 'Take your first steps into the world of geography', 0),
('Bronze Pathfinder', 'Show promising navigation skills', 1000),
('Bronze Master', 'Master the basics of geographical discovery', 2500),

-- Silver Tier
('Silver Scout', 'Demonstrate advanced knowledge of locations', 3500),
('Silver Explorer', 'Navigate with increasing precision', 3700),
('Silver Master', 'Show exceptional geographical intuition', 3850),

-- Gold Tier
('Gold Voyager', 'Achieve remarkable accuracy in your explorations', 4000),
('Gold Navigator', 'Display outstanding geographical expertise', 4250),
('Gold Master', 'Reach the elite ranks of world explorers', 4500),

-- Diamond Tier
('Diamond Cartographer', 'Join the ranks of legendary geographers', 4750),
('Diamond Sage', 'Achieve near-perfect geographical mastery', 4850),
('Diamond Grandmaster', 'Reach the pinnacle of geographical excellence', 4950);

-- Create a function to award tier achievements
CREATE OR REPLACE FUNCTION check_tier_achievements(user_id INTEGER, score INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Bronze Tier
    IF score >= 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Novice Explorer'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 1000 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Bronze Pathfinder'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 2500 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Bronze Master'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Silver Tier
    IF score >= 3500 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Silver Scout'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 3700 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Silver Explorer'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 3850 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Silver Master'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Gold Tier
    IF score >= 4000 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Gold Voyager'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 4250 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Gold Navigator'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 4500 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Gold Master'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Diamond Tier
    IF score >= 4750 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Diamond Cartographer'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 4850 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Diamond Sage'
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF score >= 4950 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT $1, id FROM achievements WHERE name = 'Diamond Grandmaster'
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the existing check_and_award_achievements function to include tier achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_id INTEGER, location_id INTEGER, score INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Award achievements based on category
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT DISTINCT $1, a.id
    FROM achievements a
    JOIN locations l ON a.category_id = l.category_id
    WHERE l.id = $2 AND score >= a.points_required
    ON CONFLICT DO NOTHING;

    -- Award achievements based on country
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT DISTINCT $1, a.id
    FROM achievements a
    JOIN locations l ON a.country = l.country
    WHERE l.id = $2 AND score >= a.points_required
    ON CONFLICT DO NOTHING;

    -- Check and award tier achievements
    PERFORM check_tier_achievements($1, $3);
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
    BEFORE UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Challenge system tables

-- Challenges table to track challenges between users
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenged_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    current_round INTEGER DEFAULT 1
);

-- Challenge locations table to store the 5 locations for each challenge
CREATE TABLE challenge_locations (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    UNIQUE(challenge_id, order_index)
);

-- Challenge scores table to track scores for each location in a challenge
CREATE TABLE challenge_scores (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    time_taken INTEGER NOT NULL, -- In seconds
    distance FLOAT NOT NULL, -- Distance in km
    guess_latitude FLOAT NOT NULL CHECK (guess_latitude BETWEEN -90 AND 90),
    guess_longitude FLOAT NOT NULL CHECK (guess_longitude BETWEEN -180 AND 180),
    round_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, user_id, location_id)
);

-- Create indexes for performance
CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX idx_challenge_locations_challenge ON challenge_locations(challenge_id);
CREATE INDEX idx_challenge_scores_challenge ON challenge_scores(challenge_id);
CREATE INDEX idx_challenge_scores_user ON challenge_scores(user_id);

-- Add challenge-related achievements
INSERT INTO achievements (name, description, points_required) VALUES
('Challenge Novice', 'Complete your first challenge', 0),
('Challenge Master', 'Win 5 challenges', 0),
('Challenge Champion', 'Win 10 challenges', 0),
('Perfect Challenger', 'Score 5000 points in a single challenge', 0);

-- Create a function to check and award challenge achievements
CREATE OR REPLACE FUNCTION check_challenge_achievements(player_id INTEGER) RETURNS void AS $$
BEGIN
    -- Challenge Novice (First challenge completed)
    IF (
        SELECT COUNT(DISTINCT challenge_id) 
        FROM challenge_scores cs
        WHERE cs.user_id = player_id
    ) = 1 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT player_id, id FROM achievements 
        WHERE name = 'Challenge Novice'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Challenge Master (Win 5 challenges)
    IF (
        SELECT COUNT(*) 
        FROM challenges c
        WHERE c.winner_id = player_id
    ) = 5 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT player_id, id FROM achievements 
        WHERE name = 'Challenge Master'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Challenge Champion (Win 10 challenges)
    IF (
        SELECT COUNT(*) 
        FROM challenges c
        WHERE c.winner_id = player_id
    ) = 10 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT player_id, id FROM achievements 
        WHERE name = 'Challenge Champion'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Perfect Challenger (Score 5000 points in a single challenge)
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT SUM(cs.score) as total_score
            FROM challenge_scores cs
            WHERE cs.user_id = player_id
            GROUP BY cs.challenge_id
        ) scores
        WHERE total_score >= 5000
    ) THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT player_id, id FROM achievements 
        WHERE name = 'Perfect Challenger'
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check challenge achievements when a challenge is completed
CREATE OR REPLACE FUNCTION check_challenge_completion() RETURNS TRIGGER AS $$
BEGIN
    -- Check achievements for both players
    PERFORM check_challenge_achievements(NEW.challenger_id);
    PERFORM check_challenge_achievements(NEW.challenged_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER challenge_completion_trigger
    AFTER UPDATE OF status ON challenges
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION check_challenge_completion();

-- Add triggers for updating timestamps
CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add connection pooling configuration
ALTER DATABASE guesswhere SET max_connections = 100;