import ScrollExpandMedia from './ui/scroll-expansion-hero';

const VideoSection = () => {
    return (
        <section id="demo">
            <ScrollExpandMedia
                mediaType="video"
                mediaSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1"
                posterSrc="https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg"
                title="Watch DoneOne In Action"
                subtitle="See It In Action"
                scrollHint="Scroll to Expand"
                textBlend={true}
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

export default VideoSection;
