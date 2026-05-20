"use client"

import { useState, useEffect } from "react"
import { motion, useSpring } from "framer-motion"

export function CursorTracker() {
    const mouseX = useSpring(0, { stiffness: 50, damping: 20 })
    const mouseY = useSpring(0, { stiffness: 50, damping: 20 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [mouseX, mouseY])

    return (
        <motion.div
            className="cursor-glow"
            style={{
                left: mouseX,
                top: mouseY,
            }}
        />
    )
}
