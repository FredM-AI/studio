import PlayerForm from '@/app/players/PlayerForm';
import { createPlayer } from '@/app/players/actions';

export default function NewPlayerPage() {
  return (
    <div>
      <PlayerForm 
        action={createPlayer}
        formTitle="Add New Player"
        formDescription="Enter the details for the new player."
        submitButtonText="Create Player"
      />
    </div>
  );
}
