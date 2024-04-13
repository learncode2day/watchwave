'use client';
import options from '@/app/lib/options';
import { getImagePath } from '@/app/lib/tmdb';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import NewCard from '../NewCard';
import Link from 'next/link';
import { MovieDetails, ShowDetails } from '@/types';

interface Collection {
	backdrop_path: string;
	id: number;
	name: string;
	poster_path: string;
}

const Collection = ({ collection }: { collection: Collection }) => {
	console.log(collection);
	const [collectionData, setCollectionData] = useState(null);

	const fetchCollection = async (collection: Collection) => {
		const col = await fetch(`https://api.themoviedb.org/3/collection/${collection.id}?language=en-US`, options);
		let data = await col.json();

		setCollectionData(data);
	};

	useEffect(() => {
		fetchCollection(collection);

		return () => {
			setCollectionData(null);
		};
	}, []);

	useEffect(() => {
		console.log(collectionData);
	}, [collectionData]);

	return (
		<div className="w-full relative overflow-hidden rounded-2xl">
			<div className="fc w-full relative">
				{collectionData && (
					<>
						<div className="bg-black/80 absolute inset-0 z-0">
							<svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="svg-filters">
								<defs>
									<filter id="turbulence" x="0" y="0">
										<feTurbulence type="fractalNoise" baseFrequency="6.29" numOctaves="6" stitchTiles="stitch"></feTurbulence>
										{/* <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="50" xChannelSelector="R" yChannelSelector="G" /> */}
									</filter>
								</defs>
							</svg>
						</div>
						<Image
							width={250}
							height={375}
							className="absolute inset-0 w-full object-cover h-full -z-10"
							src={getImagePath(collection.backdrop_path, 'original')}
							alt="Poster"
						/>
						<div className="px-2 sm:px-5 py-3 fc w-full z-10 items-start">
							<h3 className="text-xl sm:text-2xl font-bold">{collection.name}</h3>
							<p className="text-sm sm:text-base max-w-xl">{collectionData.overview}</p>
							<div className="fr gap-3 mt-5 flex-wrap">
								{collectionData &&
									collectionData.parts.map((part) => (
										<Link key={part.id} href={`/watch/${part.media_type}/${part.id}`}>
											<Image
												src={getImagePath(part.poster_path, 'w200')}
												alt="Poster"
												width={100}
												height={150}
												className="rounded-xl"
											/>
										</Link>
									))}
							</div>
							<div className="fr w-full flex-wrap gap-5"></div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Collection;
