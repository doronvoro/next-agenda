-- Add vote_status column to protocol_members table
ALTER TABLE public.protocol_members
ADD COLUMN vote_status INTEGER NULL;

-- Add comment to explain the vote_status values
COMMENT ON COLUMN public.protocol_members.vote_status IS 'Vote status: 1=For, 2=Against, 3=Abstain, NULL=No vote';

-- Create index for better performance on vote_status queries
CREATE INDEX IF NOT EXISTS idx_protocol_members_vote_status ON public.protocol_members(vote_status); 