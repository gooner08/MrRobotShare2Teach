import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Resource } from "../entity/resource.entity";
import { Rating } from "../entity/rate.entity";

// Rate a resource
export const rateResource = async (req: Request, res: Response) => {
    try {
        const { resourceId, score, comment } = req.body;

        // Validate score
        if (!score || score < 1 || score > 5) {
            return res.status(400).json({ message: "Invalid rating score. Must be between 1 and 5." });
        }

        const resourceRepository = getRepository(Resource);
        const ratingRepository = getRepository(Rating);

        // Find the resource by ID
        const resource = await resourceRepository.findOne({ where: { id: resourceId }, relations: ['ratings'] });

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        // Create and save the new rating
        const newRating = new Rating();
        newRating.score = score;
        newRating.comment = comment || '';
        newRating.resource = resource;

        await ratingRepository.save(newRating);

        // Calculate new average rating
        const allRatings = await ratingRepository.find({ where: { resource: resource } });
        const totalScore = allRatings.reduce((sum, rating) => sum + rating.score, 0);
        const averageRating = totalScore / allRatings.length;

        return res.status(201).json({
            message: "Rating submitted successfully",
            resourceId: resource.id,
            averageRating: averageRating.toFixed(2),
            totalRatings: allRatings.length
        });

    } catch (error) {
        return res.status(500).json({ message: "Error submitting rating", error: error.message });
    }
};

// Fetch all ratings for a resource
export const getResourceRatings = async (req: Request, res: Response) => {
    try {
        const resourceId = parseInt(req.params.id, 10);

        if (isNaN(resourceId)) {
            return res.status(400).json({ message: "Invalid resource ID" });
        }

        const resourceRepository = getRepository(Resource);
        const ratingRepository = getRepository(Rating);

        const resource = await resourceRepository.findOne({ where: { id: resourceId }, relations: ['ratings'] });

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        const ratings = await ratingRepository.find({ where: { resource: resource } });

        return res.status(200).json({
            resourceId: resource.id,
            ratings: ratings.map(rating => ({
                score: rating.score,
                comment: rating.comment,
                id: rating.id
            }))
        });

    } catch (error) {
        return res.status(500).json({ message: "Error fetching ratings", error: error.message });
    }
};
