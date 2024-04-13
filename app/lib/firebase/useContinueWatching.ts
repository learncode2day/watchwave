// write a hook that takes in an id and a type and adds the id to the user's continue watching list

import { doc, setDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserAuth } from '../../context/AuthContext';

const useAddToContinueWatching = (type: string | null | undefined, id: number | null | undefined, time?: number) => {
	const { user } = UserAuth();
	const add = async () => {
		if (!user || !id || !type) return;

		const userRef = doc(db, 'users', user.uid);
		const continueWatchingSnapshot = await getDoc(userRef);

		const continueWatchingData = continueWatchingSnapshot.data()?.continueWatching ?? [];

		const existingIndex = continueWatchingData.findIndex((item) => item.id === id && item.type === type);

		if (existingIndex !== -1) {
			// If the item already exists, update its time
			continueWatchingData[existingIndex].time = time ?? null;
		} else {
			// If the item does not exist, add it to the array
			continueWatchingData.push({ id, type, time: time ?? null });
		}

		await setDoc(
			userRef,
			{
				continueWatching: continueWatchingData,
			},
			{ merge: true }
		);
	};
	const remove = async () => {
		if (!user) return;
		if (!id || !type) return;

		const userRef = doc(db, 'users', user.uid);
		const continueWatchingSnapshot = await getDoc(userRef);

		const continueWatchingData = continueWatchingSnapshot.data()?.continueWatching ?? [];
		console.log(continueWatchingData);
		// remove object from array
		const updatedData = continueWatchingData.filter((item) => item.id !== id || item.type !== type);
		console.log('Removing ', updatedData);

		await setDoc(
			userRef,
			{
				continueWatching: updatedData,
			},
			{ merge: true }
		);
	};
	return { add, remove };
};

export default useAddToContinueWatching;
