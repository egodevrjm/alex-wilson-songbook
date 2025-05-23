import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

const PublicSongViewer = ({ song, allSongs, onNavigateToAlbum, albums = [] }) => {
  const { playSong } = useMusicPlayer();

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No Song Selected</h2>
        <p className="text-gray-500 text-center">Choose a song from the list to view its details.</p>
      </div>
    );
  }

  // Find which albums contain this song
  const containingAlbums = albums.filter(album => 
    album.songs && album.songs.some(albumSong => albumSong.slug === song.slug)
  );

  // Get song metadata
  const createdDate = song.createdAt ? new Date(song.createdAt).toLocaleDateString('en-GB') : null;
  const updatedDate = song.updatedAt ? new Date(song.updatedAt).toLocaleDateString('en-GB') : null;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Song Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            {/* Song Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{song.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Alex Wilson
                </span>
                
                {createdDate && (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {createdDate}
                  </span>
                )}

                {song.soundsLike && (
                  <span className="flex items-center text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Sounds like: {song.soundsLike}
                  </span>
                )}
              </div>

              {/* Album Information */}
              {containingAlbums.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {containingAlbums.map(album => (
                    <button
                      key={album.id}
                      onClick={() => onNavigateToAlbum && onNavigateToAlbum(album.id)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-violet-100 text-violet-800 hover:bg-violet-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {album.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Song Image */}
            {song.image && (
              <div className="mt-4 md:mt-0 md:ml-6 shrink-0">
                <img 
                  src={song.image} 
                  alt={song.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>

          {/* Audio Player */}
          {song.audio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => playSong(song, allSongs)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Play Song
              </button>
            </div>
          )}
        </div>

        {/* Song Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lyrics */}
          {song.lyrics && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Lyrics
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  <ReactMarkdown>{song.lyrics}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Notes and Metadata */}
          <div className="space-y-6">
            {/* Notes */}
            {song.notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notes
                </h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  <ReactMarkdown>{song.notes}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Song Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Details
              </h3>
              <div className="space-y-3 text-sm">
                {createdDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-900">{createdDate}</span>
                  </div>
                )}
                {updatedDate && updatedDate !== createdDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated:</span>
                    <span className="text-gray-900">{updatedDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Has Audio:</span>
                  <span className={song.audio ? 'text-green-600' : 'text-gray-400'}>
                    {song.audio ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Has Image:</span>
                  <span className={song.image ? 'text-green-600' : 'text-gray-400'}>
                    {song.image ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSongViewer;
