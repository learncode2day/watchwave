'use client';
import { cn } from '@/app/lib/utils';
import { usePlayerStore } from '@/app/store/player-state-provider';
import { Button } from '@nextui-org/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { IoCheckmark, IoClose } from 'react-icons/io5';
import { LuLoader } from 'react-icons/lu';

const MultiStepLoader = ({ failAll }: { failAll: () => void }) => {
	// mock loading state
	const { loaderO } = usePlayerStore((state) => state);
	const [value, setValue] = useState(0);

	useEffect(() => {
		// once any of the loading state is completed, move to the next one, setting value to the next index
		const nextIndex = loaderO.findIndex((state) => state.completed == false);
		setValue(nextIndex);
	}, [loaderO]);
	return (
		<AnimatePresence mode="wait">
			{/* if everything is completed, remove loader */}
			{loaderO.every((state) => state.completed) ? null : (
				<motion.div
					initial={{
						opacity: 0,
					}}
					animate={{
						opacity: 1,
					}}
					exit={{
						opacity: 0,
					}}
					className="fixed inset-0 z-[100] flex h-full w-full items-center justify-center backdrop-blur-2xl"
				>
					<Button className="absolute top-2 right-2 z-50" onClick={() => failAll()}>
						Switch to Embeds
					</Button>
					<div className="relative z-50 h-96">
						{/* FOR TESTING:DIV of buttons that set the loading state */}
						{/* <div className="z-50 flex justify-center gap-4">
              {loaderO.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newStates = [...loaderO];
                    newStates[index].completed = true;
                    console.log(newStates);
                    setLoaderO(newStates);
                  }}
                  className="rounded-lg bg-lime-500 px-4 py-2 text-white"
                >
                  {index}
                </button>
              ))}
            </div> */}
						<div className="relative mx-auto mt-40 flex max-w-xl flex-col justify-start">
							{loaderO.map((loadingState, index) => {
								const distance = Math.abs(index - value);
								const opacity = Math.max(1 - distance * 0.2, 0); // Minimum opacity is 0, keep it 0.2 if you're sane.

								return (
									<motion.div
										key={index}
										className={cn('fr mb-4 justify-center gap-2')}
										initial={{ opacity: 0, y: -(value * 40) }}
										animate={{ opacity: opacity, y: -(value * 40) }}
										transition={{ duration: 0.5 }}
									>
										<div>
											{loadingState.completed === 'failed' && <IoClose className="text-red-500" />}
											{loadingState.completed === false && <LuLoader className="animate-spin" />}
											{loadingState.completed === true && (
												<IoCheckmark
													className={cn(
														'text-white',
														loadingState.completed ? 'text-lime-500' : '',
														value === index && ' opacity-100 text-white'
														// if complete, green text
													)}
												/>
											)}
										</div>
										<span
											className={cn(
												'text-white',
												loadingState.completed ? 'text-lime-500' : 'text-white/50',
												value === index && 'opacity-100 text-white',
												// if failed, red text
												loadingState.completed === 'failed' && 'text-red-500'
											)}
										>
											{loadingState.text}
										</span>
									</motion.div>
								);
							})}
							<div className="text-sm text-white/60">
								If stuck on Video Initializing,{' '}
								<button onClick={() => failAll()} className="text-blue-500 underline underline-offset-2">
									Switch to Embeds
								</button>
							</div>
						</div>
					</div>

					<div className="absolute inset-x-0 bottom-0 z-20 h-full bg-white bg-gradient-to-t [mask-image:radial-gradient(900px_at_center,transparent_40%,white)] dark:bg-black" />
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default MultiStepLoader;
