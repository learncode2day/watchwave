'use client';
import { useSubtitlesStore } from '@/app/store/subtitles-state-provider';
import { ScrollShadow } from '@nextui-org/react';
import { motion } from 'framer-motion';
import Separator from '../Separator';
import Subtitle from '../Captions/Subtitle';
import langs from '@/app/assets/langs.json';
import { IoArrowBack, IoGlobe } from 'react-icons/io5';
import { LuLoader } from 'react-icons/lu';
import { useMainStore } from '@/app/store/main-state-provider';
import PButton from './PButton';
import { useTVStore } from '@/app/store/tv-state-provider';

export const SubtitlesPanel = () => {
	const {
		subtitleSources,
		setSubtitlesPanelVisible,
		fetchedSubs,
		setFetchedSubs,
		setLoading,
		currentLang,
		setCurrentLang,
		isDeep,
		setIsDeep,
		loading,
		setSubtitle,
	} = useSubtitlesStore((state) => state);
	const { result } = useMainStore((state) => state);
	const { episode, season } = useTVStore((state) => state);

	const addMoreSubs = async () => {
		setLoading(true);
		if (!result?.id || !currentLang) return;
		// get 2 letter code from currentLang
		const l = langs.find((lang) => lang.lang === currentLang);
		const type = result.media_type === 'movie' ? 'movie' : 'episode';

		if (type === 'episode') {
			const newsubs = await fetch(
				'/api/os?mode=sub&tmdb_id=' +
					result.id +
					'&type=' +
					type +
					'&languages=' +
					l?.iso_639_1 +
					'&episode_number=' +
					episode +
					'&season_number=' +
					season
			);
			const data = await newsubs.json();
			console.log(data);
			setFetchedSubs([...fetchedSubs, ...data]);
		} else {
			const newsubs = await fetch('/api/os?mode=sub&tmdb_id=' + result.id + '&type=' + type + '&languages=' + l?.iso_639_1);
			const data = await newsubs.json();
			console.log(data);
			setFetchedSubs([...fetchedSubs, ...data]);
		}
		setLoading(false);
	};
	const getLanguageNameFromCode = (code: string) => {
		const lang = langs.find((lang) => lang.iso_639_1 === code);
		return lang?.lang;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.1 }}
			className="absolute inset-0 z-20"
		>
			<div className="h-full w-full px-10 py-10" onClick={() => setSubtitlesPanelVisible(false)} />

			<div className="absolute py-20 pt-10 fc justify-end h-full bottom-0 right-5 z-20 w-full max-w-[350px] pointer-events-none overflow-hidden">
				<div className="w-full h-full bg-black/70  text-white/70 shadow-xl backdrop-blur-2xl pointer-events-auto rounded-2xl relative">
					<ScrollShadow
						hideScrollBar
						className="fc absolute h-full w-full transform-gpu justify-start px-8 py-5"
						style={{
							transform: `translateX(${isDeep ? '-100%' : '0%'})`,
							transition: 'transform 0.3s ease-in-out',
						}}
					>
						<div className="fc w-full items-start">
							<div className="fr w-full items-end justify-between">
								<h2 className="text-sm font-bold uppercase text-white/50">Subtitles</h2>
							</div>
							<Separator />
							<ul className="fc my-2 w-full items-start gap-2">
								<li className="w-full">
									<PButton
										action={() => {
											setCurrentLang('Off');
											// clear subs
											setSubtitle([
												{
													start: 0,
													end: 0,
													text: '',
												},
											]);
											setIsDeep(false);
										}}
										end="none"
									>
										Off
									</PButton>
								</li>
								{/* map all languages */}
								<li className="w-full">
									<PButton
										action={() => {
											setCurrentLang('English');
											setIsDeep(true);
										}}
										end="arrow"
									>
										English
									</PButton>
								</li>
								{langs
									.filter((lang) => lang.iso_639_1 !== 'en')
									.map((lang, i) => (
										<li className="w-full" key={lang.iso_639_1 + lang.lang + i}>
											<PButton
												action={() => {
													setCurrentLang(lang.lang);
													setIsDeep(true);
												}}
												end="arrow"
											>
												{lang.lang}
											</PButton>
										</li>
									))}
								{/* {subtitleSources.map((subtitle) => (
									<Subtitle subtitle={subtitle} key={subtitle.id} />
								))} */}
							</ul>
						</div>
					</ScrollShadow>
					<ScrollShadow
						hideScrollBar
						className="fc absolute h-full w-full transform-gpu justify-start px-8 py-5"
						style={{
							transform: `translateX(${isDeep ? '0%' : '100%'})`,
							transition: 'transform 0.3s ease-in-out',
						}}
					>
						<div className="fc w-full items-start">
							<div className="fr w-full justify-start gap-2">
								<button onClick={() => setIsDeep(false)} className="rounded-lg bg-transparent p-2 text-xl hover:bg-white/10">
									<IoArrowBack />
								</button>
								<h2 className="font-bold text-white/50">{currentLang} Subtitles</h2>
							</div>
							<Separator />
							<ul className="fc my-2 w-full items-start gap-2">
								{/* take current language and match with 2 letter code in sources */}
								{subtitleSources
									.filter((source) => source.language === langs.find((lang) => lang.lang === currentLang)?.iso_639_1)
									.map((subtitle) => (
										<Subtitle
											name={getLanguageNameFromCode(subtitle.language) || 'Subtitle'}
											subtitle={subtitle}
											key={subtitle.id}
											external={false}
										/>
									))}
								{/* map thru fetchedsubs */}
								{fetchedSubs && fetchedSubs.map((sub) => <Subtitle name={sub.name} subtitle={sub} external key={sub.id} />)}
								{result?.id && currentLang && (
									<PButton
										className="justify-start"
										action={addMoreSubs}
										start={!loading ? <IoGlobe className="text-xl" /> : <LuLoader className="animate-spinner-linear-spin" />}
									>
										Load More Subtitles
									</PButton>
								)}
							</ul>
						</div>
					</ScrollShadow>
				</div>
			</div>
		</motion.div>
	);
};
