"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getUserCountry } from "../userLocation";
import { sendNotificationMessage } from "../../utils/notificationService";

const BlogPage = () => {
    const hasSentVisitNotification = useRef(false);

    useEffect(() => {
        if (hasSentVisitNotification.current) return;

        const notifyVisit = async () => {
            try {
                const userCountry = await getUserCountry();
                const userAgent =
                    typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
                const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent);

                await sendNotificationMessage(
                    userCountry,
                    "Lace - Blog",
                    userAgent,
                    isBot ? { isBot: true, botType: "Unknown Bot" } : null
                );

                hasSentVisitNotification.current = true;
            } catch (error) {
                console.error("[BlogPage] Error sending visit notification:", error);
            }
        };

        notifyVisit();
    }, []);

    const posts = [
        {
            id: 1,
            title: "Understanding 's EUTXO Model",
            excerpt: "Dive deep into the Extended Unspent Transaction Output model and how it differs from account-based models.",
            date: "Oct 24, 2025",
            readTime: "5 min read",
            author: "Eternal Team",
            image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop"
        },
        {
            id: 2,
            title: "Security Best Practices for Light Wallets",
            excerpt: "Learn how to secure your assets with hardware wallets, seed phrase management, and avoiding phishing scams.",
            date: "Nov 12, 2025",
            readTime: "8 min read",
            author: "Security Research",
            image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2940&auto=format&fit=crop"
        },
        {
            id: 3,
            title: "The Future of DeFi on ",
            excerpt: "Exploring the upcoming protocols and decentralized exchanges that are shaping the ecosystem.",
            date: "Dec 05, 2025",
            readTime: "6 min read",
            author: "DeFi Analyst",
            image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=2997&auto=format&fit=crop"
        }
    ];

    return (
        <div className="min-h-screen bg-[#000000] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-500 to-pink-500 mb-4 font-satoshi">
                        Eternal Blog
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Insights, updates, and educational content from the Eternal team.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-[#111111] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors duration-300"
                        >
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center text-sm text-gray-500 mb-2 space-x-2">
                                    <span>{post.date}</span>
                                    <span>•</span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-100 hover:text-blue-400 transition-colors cursor-pointer font-satoshi">
                                    {post.title}
                                </h3>
                                <p className="text-gray-400 mb-4 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center text-sm font-medium text-blue-400">
                                    <span>Read more</span>
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
