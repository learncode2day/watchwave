import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	type Uploader = {
		uploader_id: number;
		name: string;
		rank: string;
	};

	type FeatureDetails = {
		feature_id: number;
		feature_type: string;
		year: number;
		title: string;
		movie_name: string;
		imdb_id: number;
		tmdb_id: number;
	};

	type RelatedLink = {
		label: string;
		url: string;
		img_url: string;
	};

	type File = {
		file_id: number;
		cd_number: number;
		file_name: string;
	};

	type Attributes = {
		subtitle_id: string;
		language: string;
		download_count: number;
		new_download_count: number;
		hearing_impaired: boolean;
		hd: boolean;
		fps: number;
		votes: number;
		ratings: number;
		from_trusted: boolean;
		foreign_parts_only: boolean;
		upload_date: string;
		ai_translated: boolean;
		nb_cd: number;
		machine_translated: boolean;
		release: string;
		comments: string;
		legacy_subtitle_id: number;
		legacy_uploader_id: number;
		uploader: Uploader;
		feature_details: FeatureDetails;
		url: string;
		related_links: RelatedLink[];
		files: File[];
	};

	type Subs = {
		id: string;
		type: string;
		attributes: Attributes;
	};

	const { searchParams } = new URL(request.url);
	const tmdb_id = searchParams.get('tmdb_id');
	const type = searchParams.get('type');
	const languages = searchParams.get('languages');
	const mode = searchParams.get('mode');
	const id = searchParams.get('id');
	const episode_number = searchParams.get('episode_number');
	const season_number = searchParams.get('season_number');

	if (mode === 'sub') {
		if (type === 'movie') {
			// const { id, type, lang } = request.body;
			const response = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?tmdb_id=${tmdb_id}&type=${type}&languages=${languages}`, {
				method: 'GET',
				headers: {
					'User-Agent': 'WatchWave v1.0',
					'Api-Key': process.env.NEXT_PUBLIC_OS_API,
				},
			});
			const data = await response.json();
			if (typeof data === 'string') return NextResponse.error();
			const subtitles = data.data.map((sub: Subs) => {
				return {
					id: sub.id,
					language: sub.attributes.language,
					name: sub.attributes.release,
					files: sub.attributes.files.map((file) => {
						return {
							file_id: file.file_id,
							file_name: file.file_name,
						};
					}),
				};
			});
			return NextResponse.json(subtitles);
		} else if (type === 'episode') {
			const response = await fetch(
				`https://api.opensubtitles.com/api/v1/subtitles?tmdb_id=${tmdb_id}&type=${type}&languages=${languages}&episode_number=${episode_number}&season_number=${season_number}`,
				{
					method: 'GET',
					headers: {
						'User-Agent': 'WatchWave v1.0',
						'Api-Key': process.env.NEXT_PUBLIC_OS_API,
					},
				}
			);
			const data = await response.json();
			if (typeof data === 'string') return NextResponse.error();
			const subtitles = data.data.map((sub: Subs) => {
				return {
					id: sub.id,
					language: sub.attributes.language,
					name: sub.attributes.release,
					files: sub.attributes.files.map((file) => {
						return {
							file_id: file.file_id,
							file_name: file.file_name,
						};
					}),
				};
			});
			return NextResponse.json(subtitles);
		}
	} else if (mode === 'file') {
		const url = 'https://api.opensubtitles.com/api/v1/download';
		const options = {
			method: 'POST',
			headers: {
				'User-Agent': 'WatchWave v1.0',
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'Api-Key': process.env.NEXT_PUBLIC_OS_API,
			},
			body: `{"file_id":${id}}`,
		};
		const response = await fetch(url, options);
		const data = await response.json();
		console.log(data);
		return NextResponse.json(data);
	}
}
