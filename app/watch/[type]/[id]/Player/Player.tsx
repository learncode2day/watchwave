'use client';
// import dynamic from 'next/dynamic';
// import ReactPlayer from 'react-player';
// const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import { Episodes, FastForward, Fullscreen, PIP, PlayPause, Rewind, Settings, Subtitle, Time, Volume } from './Controls/atoms';
import { RunOutput } from '@movie-web/providers';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayerStore } from '@/app/store/player-state-provider';
import { SubtitlesPanel } from './Panels/SubtitlePanel';
import { SettingsPanel } from './Panels/SettingsPanel';
import { EpisodePanel } from './Panels/EpisodePanel';
import Captions from './Captions/Captions';
import Hls from 'hls.js';
import { useSubtitlesStore } from '@/app/store/subtitles-state-provider';
import { IoChevronBack } from 'react-icons/io5';
import { Subtitles } from '@/app/store/SubtitlesStore';
import { useMainStore } from '@/app/store/main-state-provider';
import { useTVStore } from '@/app/store/tv-state-provider';
import NextEpisode from './Controls/NextEpisode';
import MultiStepLoader from './Loader';
import { toast } from 'sonner';
import IframePlayer from './IframePlayer';
import useAddToContinueWatching from '@/app/lib/firebase/useContinueWatching';
import { UserAuth } from '@/app/context/AuthContext';
import getDocData from '@/app/lib/firebase/getDocData';
import KeyboardControls from './Controls/KeyboardControls';
import Seek from './Controls/Seek';

const Player: React.FC = () => {
	const { user } = UserAuth();

	const player = useRef<HTMLVideoElement>(null);
	const { setPlayerVisibility, result } = useMainStore((state) => state);
	const { episode, season, episodePanelVisible, setEpisode, setSeason } = useTVStore((state) => state);
	const { setSubtitleSources, setFetchedSubs, subtitleSources, subtitlePanelVisible, setSubtitle } = useSubtitlesStore((state) => state);
	const {
		src,
		playing,
		muted,
		played,
		loaded,
		duration,
		seeking,
		isControlsVisible,
		setSrc,
		setPlaying,
		isMobile,
		setMobile,
		setVolume,
		setMuted,
		setPlayed,
		setLoaded,
		setDuration,
		setPlaybackRate,
		setSeeking,
		setBuffering,
		setTimeLeft,
		setIsControlsVisible,
		setQuality,
		setAvailableQualities,
		panelVisible,
		failed,
		setFailed,
		setSources,
		sources,
		setFetching,
		fetching,
		setLoaderO,
		loaderO,
	} = usePlayerStore((state) => state);

	const fetchCW = async () => {
		if (!result) return;
		const data = await getDocData(user);
		console.log(data);
		const cw = data?.continueWatching;
		if (cw) {
			const index = cw.findIndex((item) => item.id === result.id);
			console.log(index);
			if (index !== -1) {
				const { time } = cw[index];
				console.log(time);
				setPlayed(time);
				if (player.current) player.current.currentTime = time;
			}
		}
	};

	const fetchEpisode = async () => {
		if (!result) return;
		const data = await getDocData(user);
		const tracker = data?.tracker;
		// set episode and season
		if (tracker) {
			if (result.id in tracker) {
				const { episodeNumber, seasonNumber } = tracker[result.id];
				setEpisode(episodeNumber);
				setSeason(seasonNumber);
			}
		}
	};

	// text tracks change event listener
	// useEffect(() => {
	// 	if (player.current) {
	// 		player.current.textTracks.addEventListener('change', () => {
	// 			console.log('text track changed');
	// 			// map through all text tracks and disable them
	// 			player.current!.textTracks.forEach((track) => {
	// 				track.mode = 'disabled';
	// 			});

	// 		});

	// 		// remove event listener when component unmounts
	// 		return () => {
	// 			player.current.textTracks.removeEventListener('change', () => {
	// 				console.log('text track changed');
	// 			});
	// 		};
	// 	}
	// }, [player.current]);

	const failAll = () => {
		loaderO.map((state, index) => {
			// set each state to failed
			const newStates = [...loaderO];
			newStates[index].completed = 'failed';
			setLoaderO(newStates);
			newStates.push({
				text: 'Finding Embeds...',
				completed: false,
			});
			// add new item with Finding Alternative Sources...
			setLoaderO([...newStates]);

			// wait 2 seconds, then set the last item to completed
			setFailed(true);
			setTimeout(() => {
				newStates[newStates.length - 1].completed = true;
				setLoaderO(newStates);
			}, 2000);
		});
	};

	// when episode changes, update the sources by calling /api/episode
	const fetchSources = (): Promise<RunOutput> => {
		if (!result) return Promise.reject('No result');
		return new Promise(async (resolve, reject) => {
			if (result.media_type === 'movie' && 'title' in result) {
				setFetching(true);
				try {
					const res = await fetch('/api/episode', {
						method: 'POST',
						body: JSON.stringify({
							type: 'movie',
							id: result.id,
							name: result.title,
							release: result.release_date,
						}),
					});
					const data = await res.json();
					console.log(data);
					setFetching(false);

					resolve(data.output);
				} catch {
					console.log('Failed to fetch sources');
					setFetching(false);
					reject();
				}
			} else if ('name' in result) {
				console.log({
					episode: episode,
					season: season + 1,
				});
				// find index of season
				setFetching(true);
				try {
					const res = await fetch('/api/episode', {
						method: 'POST',
						body: JSON.stringify({
							type: 'tv',
							episode: episode.toString(),
							season: (season + 1).toString(),
							id: result.id,
							name: result.name,
							release: result.first_air_date,
						}),
					});
					const data = await res.json();
					console.log(data);
					setFetching(false);
					resolve(data.output);
				} catch {
					console.log('Failed to fetch sources');
					setFetching(false);
					reject();
				}
			}
		});
	};
	useEffect(() => {
		console.log(loaderO);
	}, [loaderO]);

	const ca = useAddToContinueWatching(result?.media_type, result?.id, played);

	const setup = async () => {
		window.mobileCheck = function () {
			let check = false;
			(function (a) {
				if (
					/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
						a
					) ||
					/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
						a.substr(0, 4)
					)
				)
					check = true;
			})(navigator.userAgent || navigator.vendor || window.opera);
			return check;
		};
		if (window.mobileCheck()) {
			setMobile(true);
		}

		result?.media_type === 'tv' && (await fetchEpisode());

		if (failed) {
			if (user) await fetchCW();
			return;
		}
		console.log('fetching', fetching);

		if (!fetching)
			fetchSources().then(
				(sources) => {
					setLoader('getting', true);
					setSources(sources);
					handleSources(sources);
				},
				(reason) => {
					console.error(reason);
					failAll();
				}
			);
		// fetch timing after episode has been set
		if (user) await fetchCW();
	};

	useEffect(() => {
		// add to continue watching when the component mounts
		ca.add();

		setup();
		return () => {
			ca.add();
			setSources(null);
			setSrc('');
			setPlaying(false);
			setVolume(1);
			setMuted(false);
			setPlayed(0);
			setLoaded(false);
			setDuration(0);
			setPlaybackRate(1.0);
			// setEpisode(0);
			// setSeason(0);
			setSeeking(false);
			setBuffering(false);
			setTimeLeft(null);
			setIsControlsVisible(true);
			setQuality(null);
			setAvailableQualities([]);
			setSubtitleSources([]);
			setFetchedSubs([]);
			setSubtitle([
				{
					start: 0,
					end: 0,
					text: '',
				},
			]);
			if (!failed) {
				console.log('resetting loader');
				setLoaderO([
					{
						text: 'Getting Sources...',
						completed: false,
					},
					{
						text: 'Parsing Sources...',
						completed: false,
					},
					{
						text: 'Getting Subtitles...',
						completed: false,
					},
					{
						text: 'Video Initializing...',
						completed: false,
					},
				]);
			}
			setFailed(false);
		};
	}, [episode, season]);

	useEffect(() => {
		console.log('controls', isControlsVisible);
	}, [isControlsVisible]);

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const [isInteracting, setIsInteracting] = useState(false);

	const setLoader = (state: 'getting' | 'parsing' | 'subs' | 'init', value: boolean | 'failed') => {
		let index;
		switch (state) {
			case 'getting':
				index = 0;
				break;
			case 'parsing':
				index = 1;
				break;
			case 'subs':
				index = 2;
				break;
			case 'init':
				index = 3;
				break;
		}

		console.log(loaderO);
		const newState = [...loaderO];
		newState[index].completed = value;
		setLoaderO(newState);
	};

	useEffect(() => {
		console.log(`%c Failed ${failed}`, 'background: #222; color: #bada55; font-size: 25px; font-weight: bold;');
	}, [failed]);

	const handleSources = (s: RunOutput | null) => {
		console.log(s);
		if (s === null && !fetching) {
			failAll();
			return;
		}
		if (failed) return;
		if (!s?.stream.type) return;
		if (s.stream.type === 'file') {
			const qualities = Object.keys(s.stream.qualities).sort((a, b) => {
				if (a === '4k') {
					return -1; // '4k' should come before any other value
				} else if (b === '4k') {
					return 1; // '4k' should come before any other value
				} else {
					return Number(b) - Number(a); // Convert keys to numbers and sort in ascending order
				}
			});

			setAvailableQualities(qualities);

			// set highest available quality as default
			setQuality(qualities[0]);

			// set url to the highest quality available

			if (s.stream.qualities[qualities[0] as keyof typeof s.stream.qualities]?.url.includes('shegu.net')) {
				// append KEY7=23&KEY8=0
				const url = s.stream.qualities[qualities[0] as keyof typeof s.stream.qualities]?.url;
				const newUrl = `${url}&KEY7=23&KEY8=0`;
				setSrc(newUrl);
			} else {
				setSrc(s.stream.qualities[qualities[0] as keyof typeof s.stream.qualities]?.url);
			}

			setLoader('parsing', true);

			// set subtitles variable
			// prepend each subtitle url with https://jocular-fairy-e633ed.netlify.app
			const newCaptions = s.stream.captions.map((caption: Subtitles) => {
				return {
					...caption,
					url: `https://jocular-fairy-e633ed.netlify.app/?destination=${caption.url}`,
				};
			});
			setSubtitleSources(newCaptions);
			setLoader('subs', true);
		} else {
			// hls
			// if (!player.current) return;
			if (Hls.isSupported()) {
				const hls = new Hls({
					maxBufferSize: 500 * 1000 * 1000, // 500 mb of buffering, should load more fragments at once
					fragLoadPolicy: {
						default: {
							maxLoadTimeMs: 30 * 1000, // allow it load extra long, fragments are slow if requested for the first time on an origin
							maxTimeToFirstByteMs: 30 * 1000,
							errorRetry: {
								maxNumRetry: 2,
								retryDelayMs: 1000,
								maxRetryDelayMs: 8000,
							},
							timeoutRetry: {
								maxNumRetry: 3,
								maxRetryDelayMs: 0,
								retryDelayMs: 0,
							},
						},
					},
					// TODO: extract qualities from the manifest
				});
				console.log(s.stream.playlist);

				if (s.stream.captions) {
					const newCaptions = s.stream.captions.map((caption: Subtitles) => {
						return {
							...caption,
							url: `https://jocular-fairy-e633ed.netlify.app/?destination=${caption.url}`,
						};
					});
					setSubtitleSources(newCaptions);
					setLoader('subs', true);
				} else {
					setLoader('subs', 'failed');
				}
				if (s.stream.playlist.startsWith('/') && s.stream.flags.includes('cors-allowed')) {
					setFailed(true);
				}
				console.log(hls.levels);
				if (player.current) {
					hls.loadSource(s.stream.playlist);
					hls.attachMedia(player.current);
				}
				setLoader('parsing', true);
			}
			// HLS.js is not supported on platforms that do not have Media Source
			// Extensions (MSE) enabled.
			//
			// When the browser has built-in HLS support (check using `canPlayType`),
			// we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video
			// element through the `src` property. This is using the built-in support
			// of the plain video element, without using HLS.js.
			else if (player?.current?.canPlayType('application/vnd.apple.mpegurl')) {
				setSrc(s.stream.playlist);
				player.current.src = s.stream.playlist;
				setLoader('parsing', true);
			}
		}
	};

	/**
	 * Handles mouse movement to show controls and start timeout
	 * to hide controls after period of inactivity.
	 */
	const handleMouseMove = () => {
		setIsControlsVisible(true);
		if (timerRef.current && !isInteracting) {
			clearTimeout(timerRef.current);
		}
		if (!isInteracting && playing) {
			timerRef.current = setTimeout(() => {
				setIsControlsVisible(false);
			}, 2000);
		}
	};

	// on tap for mobile, after 2 seconds, hide controls
	const handleTap = () => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}
		timerRef.current = setTimeout(() => {
			setIsControlsVisible(false);
		}, 2000);
	};

	// useeffect for isInteracting
	useEffect(() => {
		if (isInteracting) {
			setIsControlsVisible(true);
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		}
	}, [isInteracting]);

	/**
	 * Cleans up the timer when the component unmounts.
	 */
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	/**
	 * Use effect hook to initialize text track on video load.
	 * Hide all text tracks, show selected track, and set subtitle state.
	 * This ensures correct text track is shown on video load.
	 */

	const seekTo = (e: number | number[]) => {
		setPlayed(e as number);
		if (player.current) player.current.currentTime = e as number;
		ca.add();
	};

	const seek15s = (direction: 'backward' | 'forward') => {
		const newTime = direction === 'forward' ? played + 15 : played - 15;
		setPlayed(newTime);
		if (player.current) player.current.currentTime = newTime;
	};

	useEffect(() => {
		const tl = duration - played;
		setTimeLeft(tl);
	}, [played, duration]);

	const playPause = () => {
		if (playing) {
			player.current?.pause();
			// add time property to continue watching
			ca.add();
			setPlaying(false);
		} else {
			setPlaying(!playing);
			player.current?.play();
		}
	};

	const startPIP = () => {
		if (player.current) {
			if (!document.pictureInPictureElement) player.current.requestPictureInPicture();
			else document.exitPictureInPicture();
		}
	};

	const changeVolume = (e: number | number[]) => {
		setVolume(e as number);
		if (player.current) player.current.volume = e as number;
	};

	const setRate = (rate: number) => {
		setPlaybackRate(rate);
		if (player.current) player.current.playbackRate = rate;
	};

	const changeQuality = (q: string) => {
		setQuality(q);
		if (player.current && sources) {
			setSrc(sources.stream.qualities[q]?.url);
			player.current.src = sources.stream.qualities[q]?.url;
			player.current.load();

			// restore the current time
			player.current.currentTime = played;
			player.current.play();
		}
	};

	useEffect(() => {
		console.log({
			episode: episode,
			season: season + 1,
		});
	}, [episode, season]);

	// if (fetching) {
	//   return (
	//     <div className="fc fixed z-40 h-screen w-full overflow-hidden bg-black">
	//       <Spinner />
	//     </div>
	//   );
	// }

	useEffect(() => {
		console.log(failed);
	}, [failed]);
	if (failed) {
		return <IframePlayer />;
	}

	// log failed with efect

	return (
		<div
			suppressHydrationWarning
			onMouseDown={() => setIsInteracting(true)}
			onMouseUp={() => setIsInteracting(false)}
			style={{ pointerEvents: 'auto' }}
			className="player fc h-full w-full"
		>
			<KeyboardControls changeVolume={changeVolume} player={player} playPause={playPause} seekTo={seekTo} startPIP={startPIP} />
			<MultiStepLoader failAll={failAll} />
			{/* {src && ( */}
			<video
				autoPlay
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				ref={player}
				// onError={() => {
				// 	setFailed(true);
				// 	failAll();
				// }}
				onDurationChange={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => setDuration((e.target as HTMLVideoElement).duration)}
				onTimeUpdate={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
					if (!seeking) setPlayed(e.currentTarget.currentTime);
				}}
				muted={muted}
				controls={false}
				onLoadedData={() => {
					console.log('loaded');
					setLoader('init', true);
					if (player.current) player.current.currentTime = played;
					setLoaded(true);
				}}
				onWaiting={() => console.log('waiting')}
				onCanPlay={() => console.log('canplay')}
				onCanPlayThrough={() => console.log('canplaythrough')}
				onStalled={() => console.log('stalled')}
				onSuspend={() => console.log('suspend')}
				onAbort={() => console.log('abort')}
				onEmptied={() => console.log('emptied')}
				onError={(e) => {
					console.error(e);
				}}
				onSeeking={() => setSeeking(true)}
				onSeeked={() => setSeeking(false)}
				playsInline
				className="aspect-video w-full"
				src={src as string}
			>
				{subtitleSources.map((source, index) => (
					<track key={index} src={source.url.split('=')[1]} kind="subtitles" srcLang={source.language} label={source.language} />
				))}
			</video>

			<Captions currentTime={played} />

			{/* Add your overlay controls here */}
			{/* Checklist */}
			{/* - [ ] Play/Pause */}
			{/* back and forward 15s */}
			{/* - [ ] Volume */}
			{/* - [ ] Fullscreen */}
			{/* - [ ] Seekbar */}
			{/* - [ ] Time */}
			{/* - [ ] Quality */}
			{/* - [ ] PiP */}
			{/* - [ ] Playback Rate */}
			{/* - [ ] Loop */}

			{/* Control bar at the bottom */}
			{loaded && (
				<div
					onMouseMove={handleMouseMove}
					onTouchStart={handleTap}
					className={`fc absolute bottom-0 z-10 h-full w-full justify-between overflow-hidden text-white ${
						!isControlsVisible && 'cursor-none'
					}`}
				>
					<AnimatePresence>
						{panelVisible && <SettingsPanel setRate={setRate} changeQuality={changeQuality} />}
						{subtitlePanelVisible && <SubtitlesPanel />}
						{episodePanelVisible && <EpisodePanel />}
						{/* if in the last minute of the video, show next episode */}
						{result?.media_type === 'tv' && duration - played < 120 && <NextEpisode />}
					</AnimatePresence>

					{/* if buffering, show spinning loader */}
					{/* {buffering && (
						<div className="w-full h-full absolute bg-black/50 z-10 fc justify-center items-center text-white">
							<p>Buffering...</p>
						</div>
					)} */}
					<div
						className="absolute -z-10 h-full w-full"
						onClick={(e) => {
							if (isMobile) {
								setIsControlsVisible(!isControlsVisible);
							} else {
								playPause();
							}
						}}
						onDoubleClick={(e) => {
							const screenWidth = window.innerWidth;
							const clickPosition = e.clientX;

							if (isMobile) {
								// Check if double click is on the right or left side of the screen
								if (clickPosition <= screenWidth / 2) {
									// back 15s
									seek15s('backward');
								} else {
									seek15s('forward');
								}
							} else {
								// Not a mobile device, toggle fullscreen
								if (document.fullscreenElement) document.exitFullscreen();
								document.querySelector('.player')?.requestFullscreen();
							}
						}}
					></div>
					<AnimatePresence>
						{isControlsVisible && (
							<div className="w-full h-full relative pointer-events-none">
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.2 }}
									className="md:no-pointer:flex md:pointer:hidden fr gap-3 w-full h-full bg-black/50"
								>
									{/* back 15s */}
									<Rewind seek15s={seek15s} className="!text-3xl !size-14" />
									{/* play btn */}
									<PlayPause playPause={playPause} className="!text-3xl !size-14" />
									{/* forward 15s */}
									<FastForward seek15s={seek15s} className="!text-3xl !size-14" />
								</motion.div>
								<motion.div
									initial={{ opacity: 0, y: -20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.2 }}
									className="fr absolute top-0 z-10 w-full justify-start bg-gradient-to-b from-black/90 to-transparent px-5 py-3 pb-6"
								>
									<div className="fr gap-2 text-xl pointer-events-auto">
										<button
											className="fr gap-1 text-white/50 transition-colors hover:text-white"
											onClick={() => {
												ca.add();
												setPlayerVisibility(false);
											}}
										>
											<IoChevronBack /> <span>Back</span>
										</button>
										<p className="text-white/50">/</p>
										<h1>
											{result && 'title' in result ? result.title : result?.name}
											{/* if tv, also display episode and season like S1 E1 */}
										</h1>
										{result && 'seasons' in result && (
											<p className="text-white/50">
												{/* if the first season in result.seasons is special, display current season as is, otherwise add 1 */}
												S{season + 1}
												{`E${episode}`}
											</p>
										)}
									</div>
								</motion.div>
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 20 }}
									transition={{ duration: 0.2 }}
									className="fc absolute bottom-0 z-10 w-full gap-3 bg-gradient-to-b from-transparent to-black/90 px-5 py-3 pt-6"
								>
									{/* seek bar */}
									<Seek seekTo={seekTo} setIsInteracting={setIsInteracting} />

									<div className="fr w-full justify-between gap-3">
										{/* left controls */}
										<div className="fr w-full gap-3">
											<div className="fr w-full justify-start gap-2">
												{!isMobile && (
													<>
														<Rewind seek15s={seek15s} />
														<PlayPause playPause={playPause} />
														<FastForward seek15s={seek15s} />
													</>
												)}
												{/* Volume bar */}
												{!isMobile && <Volume changeVolume={changeVolume} />}
												{/* time */}
												<Time />
											</div>
										</div>

										{/* right controls */}
										<div className="fr gap-3">
											{/* episodes if tv */}
											{result && result.media_type === 'tv' && <Episodes />}
											{/* Subtitles */}
											<Subtitle />
											{/* pip */}
											<PIP startPIP={startPIP} />
											{/* settingts */}
											<Settings />
											{/* full screen */}
											<Fullscreen />
										</div>
									</div>
								</motion.div>
							</div>
						)}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
};

export default Player;
