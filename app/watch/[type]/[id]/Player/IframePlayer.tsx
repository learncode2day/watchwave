import SourcesButton from '@/app/components/Details/SourcesButton';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { IoChevronBack } from 'react-icons/io5';
import { EpisodePanel } from './Panels/EpisodePanel';
import { useMainStore } from '@/app/store/main-state-provider';
import { toast } from 'sonner';
import { useTVStore } from '@/app/store/tv-state-provider';
import { Episodes } from './Controls/atoms';

const IframePlayer = () => {
	const { result, setPlayerVisibility, adBlocker, source } = useMainStore((state) => state);
	const { episode, season, episodePanelVisible } = useTVStore((state) => state);
	const sourceCollectionMovie = result &&
		'title' in result && [
			`https://vidsrc.to/embed/movie/${result.id}`,
			`https://vidsrc.me/embed/movie?tmdb=${result.id}`,
			`https://embed.smashystream.com/playere.php?tmdb=${result.id}`,
			`https://multiembed.mov/directstream.php?video_id=${result.id}&tmdb=1`,
			`https://anyembed.xyz/movie/${result.id}`,
		];
	const sourceCollectionTV = result &&
		'name' in result && [
			`https://vidsrc.to/embed/tv/${result.id}/${result?.seasons[0]?.name === 'Specials' ? season : season + 1}/${episode}`,
			`https://vidsrc.me/embed/tv?tmdb=${result.id}&season=${
				result?.seasons[0]?.name === 'Specials' ? season : season + 1
			}&episode=${episode}&color=006FEE`,
			`https://embed.smashystream.com/playere.php?tmdb=${result.id}&season=${
				result?.seasons[0]?.name === 'Specials' ? season : season + 1
			}&episode=${episode}`,
			`https://multiembed.mov/directstream.php?video_id=${result.id}&tmdb=1&s=${
				result?.seasons[0]?.name === 'Specials' ? season : season + 1
			}&e=${episode}`,
			`https://anyembed.xyz/tv/${result.id}/${result?.seasons[0]?.name === 'Specials' ? season : season + 1}/${episode}`,
		];

	useEffect(() => {
		if (adBlocker)
			toast.info('Please use adBlocker or Brave Browser to avoid ads', {
				position: 'top-right',
			});
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, filter: 'blur(10px)' }}
			animate={{ opacity: 1, filter: 'blur(0px)' }}
			exit={{ opacity: 0, filter: 'blur(10px)' }}
			className="fc absolute bottom-0 z-40 h-full w-full justify-between overflow-hidden bg-black text-white"
		>
			{result && (
				<>
					{'title' in result && sourceCollectionMovie && (
						<>
							<div className="fr w-full justify-start bg-black px-5 py-3">
								<div className="fr gap-2 text-xl justify-between">
									<div className="fr gap-2 text-xl">
										<button
											className="fr gap-1 text-white/50 transition-colors hover:text-white"
											onClick={() => setPlayerVisibility(false)}
										>
											<IoChevronBack /> <span>Back</span>
										</button>
										<p className="text-white/50">/</p>
										<h1>{'title' in result ? result.title : result.name}</h1>
									</div>
									<SourcesButton sourceCollection={sourceCollectionMovie} />
								</div>
							</div>
							<iframe allowFullScreen={true} className="h-full w-full" src={sourceCollectionMovie[source]} />
						</>
					)}
					{'name' in result && sourceCollectionTV && (
						<>
							<div className="fr w-full justify-start bg-black px-5 py-3">
								<div className="fr gap-2 text-xl justify-between w-full">
									<div className="fr gap-2 text-xl">
										<button
											className="fr gap-1 text-white/50 transition-colors hover:text-white"
											onClick={() => setPlayerVisibility(false)}
										>
											<IoChevronBack /> <span>Back</span>
										</button>
										<p className="text-white/50">/</p>
										<h1>{'title' in result ? result.title : result.name}</h1>
									</div>
									<div className="fr gap-2">
										<Episodes className="text-sm" />
										<SourcesButton sourceCollection={sourceCollectionTV} />
									</div>
									{result.media_type === 'tv' && episodePanelVisible && <EpisodePanel />}
								</div>
							</div>
							<iframe allowFullScreen={true} className="h-full w-full" src={sourceCollectionTV[source]} />
						</>
					)}
				</>
			)}
		</motion.div>
	);
};

export default IframePlayer;
