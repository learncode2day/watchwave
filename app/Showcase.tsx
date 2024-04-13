'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { JSXElementConstructor, ReactElement, cloneElement, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { MovieDetails, ShowDetails } from '../types';

import { IoStar, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';

import { UserAuth } from './context/AuthContext';
import getDocData from './lib/firebase/getDocData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase/firebase';
import { format } from 'date-fns';

import WatchlistButton from './components/WatchlistButton';
import PlayButton from './components/PlayButton';
import { getImagePath } from './lib/tmdb';
import Link from 'next/link';
import { Button } from '@nextui-org/react';
import { cn } from './lib/utils';
import { BgVideo } from './page';

interface Props {
	result: MovieDetails | ShowDetails;
	vid: BgVideo;
}

const Showcase = ({ result, vid }: Props) => {
	const imageURL = getImagePath(result.backdrop_path, 'original');

	const { user } = UserAuth();
	const [isInWatchlist, setIsInWatchlist] = useState(false);
	const [data, setData] = useState<any>(null);
	const [muted, setMuted] = useState(true);

	const generateDetails = () => {
		// const details = {
		// 	vote_average: (
		// 		<li className="fr gap-1 whitespace-nowrap">
		// 			<IoStar />
		// 			<span>{result.vote_average.toFixed(1)}</span>
		// 		</li>
		// 	),
		// 	release_date: new Date(result.release_date).getFullYear(),
		// 	content_rating: result.content_rating && (
		// 		<li className="whitespace-nowrap rounded-lg border-1 border-[#a1a1a1] px-1.5">{result.content_rating}</li>
		// 	),
		// 	runtime: result.runtime && format(new Date(0, 0, 0, 0, result.runtime), "h 'hr' m 'min'").toString(),
		// 	first_air_date: new Date(result.first_air_date).getFullYear(),
		// 	number_of_episodes: result.number_of_episodes && `${result.number_of_episodes} episodes`,
		// };

		// new details structure: array of objects
		let details: { key: string; value: JSX.Element | null }[] = [];

		if ('title' in result)
			details = [
				{
					key: 'vote_average',
					value: (
						<li className="fr gap-1 whitespace-nowrap">
							<IoStar />
							<span>{result.vote_average.toFixed(1)}</span>
						</li>
					),
				},
				{
					key: 'release_date',
					value: <li>{new Date(result.release_date).getFullYear()}</li>,
				},
				{
					key: 'content_rating',
					value: <li className="whitespace-nowrap rounded-lg border-1 border-[#a1a1a1] px-1.5">{result.content_rating}</li>,
				},
				{
					key: 'runtime',
					value: <li>{format(new Date(0, 0, 0, 0, result.runtime), "h 'hr' m 'min'").toString()}</li>,
				},
			];
		console.log(result.content_rating);
		if ('name' in result)
			details = [
				{
					key: 'vote_average',
					value: (
						<li className="fr gap-1 whitespace-nowrap">
							<IoStar />
							<span>{result.vote_average.toFixed(1)}</span>
						</li>
					),
				},
				{
					key: 'first_air_date',
					value: <li>{new Date(result.first_air_date).getFullYear()}</li>,
				},
				{
					key: 'content_rating',
					value: <li className="whitespace-nowrap rounded-lg border-1 border-[#a1a1a1] px-1.5">{result.content_rating}</li>,
				},
				{
					key: 'number_of_episodes',
					value: <li>{`${result.number_of_episodes} episodes`}</li>,
				},
			];

		// remove undefined or NaN or null values
		const newDetails = details.filter((detail) => detail.value || detail.value === ' ');

		// create an <li> for each value
		// in between, add a bullet point wrapped in a <li>
		let detailsArray = Object.values(newDetails).map((detail, i) => {
			// if the value is already an <li>, return it
			if (!detail) return;
			const clone = cloneElement(detail.value as ReactElement<any, string | JSXElementConstructor<any>>, {
				key: `detail-${result.id}-${i}`,
			});
			return clone;
		});

		// add a bullet point between each <li>
		detailsArray = detailsArray.reduce((acc: JSX.Element[], curr) => {
			acc.push(<li key={`bullet-${result.id}-${acc.length}`}>&bull;</li>);
			if (curr) {
				acc.push(curr);
			}
			return acc;
		}, []);

		// if the first element is a bullet, remove it
		if (detailsArray[0]?.key?.includes('bullet')) detailsArray.shift();

		// console.log(detailsArray);
		return detailsArray;
	};

	const logUser = () => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid);
		getDoc(docRef)
			.then(async (docSnap) => {
				if (!docSnap.exists()) {
					console.log('doc does not exist');
					return;
				}
				await setDoc(
					docRef,
					{
						userInfo: {
							name: user.displayName,
							email: user.email,
							photoURL: user.photoURL,
							phoneNumber: user.phoneNumber,
							uid: user.uid,
							emailVerified: user.emailVerified,
						},
					},
					{ merge: true }
				);
			})
			.catch((err) => console.log(err));
	};

	useEffect(() => {
		if (!user) return;
		logUser();
	}, [user]);

	// run getDocData only once
	useEffect(() => {
		if (!user) return;
		getDocData(user)
			.then((res) => {
				setData(res);
			})
			.catch((err) => console.log(err));
	}, [user]);

	useEffect(() => {
		if (!user) setData(null);
	}, [user]);

	useEffect(() => {
		if (!data) return;
		if (data.movie) {
			if (data.movie.includes(result.id)) {
				setIsInWatchlist(true);
			} else {
				setIsInWatchlist(false);
			}
		}
	}, [data, user]);

	console.log(vid);
	const vidref = useRef<HTMLVideoElement>(null);
	const audioref = useRef<HTMLAudioElement>(null);

	return (
		<>
			{/* <iframe className="w-screen h-screen" src="https://d.daddylivehd.sx/embed/stream-1.php">
				Your Browser Do not Support Iframe
			</iframe> */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1 }}
				className={cn('w-full h-full leading-none overflow-hidden absolute bg-black', {
					'aspect-video': vid.video.url,
				})}
			>
				<AnimatePresence>
					{!vid.video.url && (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<Image src={imageURL} priority alt="movie poster" width={1920} height={1080} className="absolute w-full" />
						</motion.div>
					)}
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
						<Image
							src={imageURL}
							priority
							alt="movie poster"
							width={1920}
							height={1080}
							className="block md:hidden absolute w-full h-full object-cover object-center"
						/>
					</motion.div>
					{/* <motion.iframe
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						width="100%"
						height="100%"
						src={vid.yt}
						frameBorder="0"
						className="absolute w-full aspect-video scale"
					></motion.iframe> */}
					<motion.video
						playsInline
						ref={vidref}
						// if video is loaded, show it
						initial={{ opacity: 0 }}
						muted={muted}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						// autoplay and loop the video, hide controls
						src={vid.video.url}
						autoPlay
						className="absolute w-full object-cover object-center h-full scale-110 hidden md:block"
						loop
					></motion.video>
				</AnimatePresence>
				<motion.div
					initial={{
						background: 'radial-gradient(ellipse 100% 80% at 80% -50%, rgba(0, 0, 0) 0%, rgb(0, 0, 0) 100%)',
					}}
					animate={{
						background: 'radial-gradient(ellipse 100% 80% at 80% 20%, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%)',
					}}
					transition={{ duration: 1 }}
					className={cn(`mask absolute h-full w-full transition-colors`, { 'bg-opacity-30': vid.video.url })}
				/>
			</motion.div>
			<div className={`fc z-10 w-full items-start justify-start pt-60 sm:pl-28`}>
				<div className="fc w-full items-start justify-start px-5 pr-10">
					{result.logo ? (
						<div className="w-full md:max-w-[calc(50%)] px-3">
							<Image src={result.logo} alt="movie logo" width={300} height={200} className="mb-5  w-full md:max-w-[250px]" />
						</div>
					) : (
						<h1 className="mb-3 pr-10 text-5xl font-bold text-white md:mb-5 md:text-8xl">
							{'title' in result ? result.title : 'name' in result ? result.name : 'No title available'}
						</h1>
					)}

					{/* details */}
					<ul className="showcase_detail fr gap-3 font-medium text-white/80 text-sm sm:text-base md:mt-1">{generateDetails()}</ul>
					<p className="mt-4 max-w-[50ch] text-base font-medium leading-normal text-white/80">{result.overview}</p>
					<div className="fr mt-4 gap-3 light">
						<Link href={`/watch/${result.media_type}/${result.id}`}>
							<PlayButton />
						</Link>
						<WatchlistButton isInWatchlist={isInWatchlist} content={result} setData={setData} />
						{/* mute/unmute */}
						{vid.video.url && (
							<Button
								variant="ghost"
								className="text-white hover:text-black sm:text-base hidden md:flex"
								radius="full"
								isIconOnly
								onClick={() => setMuted(!muted)}
							>
								{muted ? <IoVolumeMute /> : <IoVolumeHigh />}
							</Button>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default Showcase;
