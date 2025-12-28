import ScrollExpandMedia from './ui/scroll-expansion-hero';

const LandingVideoSection = () => {
    return (
        <section id="demo">
            <ScrollExpandMedia
                mediaType="video"
                mediaSrc="https://videos.pexels.com/video-files/5752729/5752729-uhd_2560_1440_30fps.mp4"
                posterSrc="/guide/board-view.png"
                title="See DoneOne in action"
                scrollHint="Scroll to explore"
            >
                <div className='max-w-4xl mx-auto text-center'>
                    <h2 className='text-3xl font-bold mb-6 text-slate-900'>
                        About DoneOne
                    </h2>
                    <p className='text-lg mb-8 text-slate-700'>
                        DoneOne is a powerful project management tool that helps teams stay organized and productive.
                        With intuitive Kanban boards, calendar views, and real-time collaboration features,
                        you can manage your projects effortlessly.
                    </p>
                    <p className='text-lg text-slate-700'>
                        Experience the smooth, scroll-driven interaction that makes exploring DoneOne a delight.
                        Our modern interface is designed to keep you focused on what matters most - getting things done.
                    </p>
                </div>
            </ScrollExpandMedia>
        </section>
    );
};

export default LandingVideoSection;
